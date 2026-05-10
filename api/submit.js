/**
 * POST /api/submit  — Form 3 (Website Content)
 *
 * Pipeline:
 *   1. Validate clientId + subject type.
 *   2. Insert main row into Supabase `website_content_submissions`.
 *   3. Best-effort ClickUp:
 *        a. Find Active Clients master task by clientId.
 *        b. Create new task in NEW---Website Content Form list with rich
 *           markdown description, link to Active Clients via Linked Client.
 *        c. Update Active Clients master with Subject Type, Submitted-At,
 *           Form 3 Supabase Row ID.
 *   4. Best-effort Sheets webhook.
 *
 * Required env vars:
 *   - SUPABASE_URL
 *   - SUPABASE_SECRET_KEY
 *   - CLICKUP_API_TOKEN
 * Optional:
 *   - SHEETS_WEBHOOK_URL
 */

import { createClient } from '@supabase/supabase-js';
import {
  PRIMARY_LIST_ID,
  ACTIVE_CLIENTS_LIST_ID,
  ACTIVE_CLIENTS_FIELD_IDS,
  FIELD_IDS,
} from './clickup-field-map.js';
import { buildCustomFields, getDropdownOptionsMap } from './clickup-build.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { state = {} } = body || {};
  const clientId = String(state.clientId || '').trim();
  if (!clientId || !/^[A-Za-z0-9_-]{1,40}$/.test(clientId)) {
    return res.status(400).json({ error: 'Valid clientId required' });
  }
  if (!['candidate', 'party'].includes(state.subjectType)) {
    return res.status(400).json({ error: 'Subject type required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey   = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured.' });
  }
  const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });

  const submittedAt = new Date().toISOString();
  const { data: row, error } = await supabase
    .from('website_content_submissions')
    .insert([{
      client_id:        clientId,
      clickup_task_id:  state.clickupTaskId || null,
      submitted_at:     submittedAt,
      subject_type:     state.subjectType,
      payload:          state,
    }])
    .select()
    .single();
  if (error) {
    return res.status(500).json({ error: 'Supabase insert failed', detail: error.message });
  }

  const errors = [];
  await syncClickUp({ state, clientId, submittedAt, supabaseRowId: row.id })
    .catch((e) => { console.error('[website-content] ClickUp sync failed:', e); errors.push({ step: 'clickup', detail: String(e.message || e) }); });
  await syncSheets({ state, clientId, submittedAt, supabaseRowId: row.id })
    .catch((e) => errors.push({ step: 'sheets', detail: String(e.message || e) }));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, id: row.id, syncErrors: errors });
}


// ─── ClickUp helpers ───────────────────────────────────────────────────

async function clickupFetch(path, opts = {}) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN not set');
  const r = await fetch(`https://api.clickup.com/api/v2${path}`, {
    ...opts,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`ClickUp ${r.status} ${path}: ${txt.slice(0, 300)}`);
  }
  return r.json();
}

async function findActiveClientByClientId(clientId) {
  const result = await clickupFetch(
    `/list/${ACTIVE_CLIENTS_LIST_ID}/task?include_closed=true&subtasks=true&page=0`
  );
  const tasks = result.tasks || [];
  for (const t of tasks) {
    const cf = (t.custom_fields || []).find(
      (f) => f.name === 'Client ID' && String(f.value || '').trim() === clientId,
    );
    if (cf) return t;
  }
  return null;
}

async function syncClickUp({ state, clientId, submittedAt, supabaseRowId }) {
  const displayName = state.displayName || state.candidateName || state.partyName || clientId;
  const taskName    = `${displayName} (${clientId}) — Website Content`;

  const activeClientTask = await findActiveClientByClientId(clientId).catch(() => null);
  // No description dump — all data lives in custom fields now.
  const description = '';

  const optionsMap = await getDropdownOptionsMap().catch((e) => {
    console.warn('[website-content] dropdown options fetch failed:', e.message);
    return {};
  });
  const { fields: customFields, unresolved } = buildCustomFields(state, optionsMap);
  if (unresolved.length) {
    console.warn('[website-content] unresolved field values:', unresolved);
  }

  // Create at 'to do' first; PUT to 'submitted' below so ClickUp emits a real
  // taskStatusUpdated webhook (the only event Worker status_change accepts).
  const newTask = await clickupFetch(`/list/${PRIMARY_LIST_ID}/task`, {
    method: 'POST',
    body: JSON.stringify({
      name: taskName,
      description,
      status: 'to do',
      tags: [`subject:${state.subjectType}`],
    }),
  });

  // Step 2: per-field POST. Failures isolated, never thrown.
  const fieldFailures = [];
  for (const cf of customFields) {
    try {
      await setCustomField(newTask.id, cf.id, cf.value);
    } catch (e) {
      const detail = { fieldId: cf.id, error: String(e.message || e) };
      console.warn('[website-content] field write failed:', detail);
      fieldFailures.push(detail);
    }
  }

  if (activeClientTask && FIELD_IDS['Linked Client']) {
    await clickupFetch(`/task/${newTask.id}/field/${FIELD_IDS['Linked Client']}`, {
      method: 'POST',
      body: JSON.stringify({ value: { add: [activeClientTask.id] } }),
    }).catch((e) => console.error('[website-content] linked-client failed:', e));
  }

  // Propagate workspace-shared fields from AC master onto the form-list task
  // (Client ID + every populated workspace-shared value).
  const formWrittenFieldIds = new Set(customFields.map((c) => c.id));
  await propagateWorkspaceFields({
    sourceTask: activeClientTask,
    destTaskId: newTask.id,
    clientId,
    skipFieldIds: formWrittenFieldIds,
    label: 'website-content',
  });

  if (activeClientTask) {
    const subjectOrderIndex = state.subjectType === 'party' ? 1 : 0;
    const updates = [
      { fid: ACTIVE_CLIENTS_FIELD_IDS['Subject Type'],                  value: subjectOrderIndex },
      { fid: ACTIVE_CLIENTS_FIELD_IDS['Website Content Submitted At'],  value: Date.parse(submittedAt) },
      { fid: ACTIVE_CLIENTS_FIELD_IDS['Form 3 Supabase Row ID'],        value: supabaseRowId },
    ].filter((u) => u.fid);

    for (const u of updates) {
      await setCustomField(activeClientTask.id, u.fid, u.value)
        .catch((e) => console.error('[website-content] master update failed:', u.fid, e.message));
    }

    // Edit-propagation: if the user updated display name (DBA / Trade Name)
    // in the form, write it back to Active Clients master.
    const masterFieldByName = {};
    for (const cf of activeClientTask.custom_fields || []) masterFieldByName[cf.name] = cf;
    if (state.displayName && masterFieldByName['DBA / Trade Name*']?.id) {
      await setCustomField(activeClientTask.id, masterFieldByName['DBA / Trade Name*'].id, String(state.displayName).trim())
        .catch((e) => console.error('[website-content] DBA propagation failed:', e.message));
    }
  }

  // PUT status to 'submitted' so ClickUp fires taskStatusUpdated → Worker F0 + W5
  await clickupFetch(`/task/${newTask.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'submitted' }),
  }).catch((e) => console.error('[website-content] status flip to submitted failed:', e.message));

  return { task_id: newTask.id, active_client_id: activeClientTask?.id || null, field_failures: fieldFailures, unresolved };
}

async function propagateWorkspaceFields({ sourceTask, destTaskId, clientId, skipFieldIds, label }) {
  const CLIENT_ID_FIELD_UUID = 'fb5566ed-7a97-4337-a698-84b07d581fb8';
  if (clientId) {
    await setCustomField(destTaskId, CLIENT_ID_FIELD_UUID, clientId)
      .catch((e) => console.error(`[${label}] Client ID write failed:`, e.message));
  }
  if (!sourceTask) return;
  for (const f of sourceTask.custom_fields || []) {
    const fid = f.id;
    if (!fid || skipFieldIds?.has(fid)) continue;
    if (fid === CLIENT_ID_FIELD_UUID) continue;
    if (f.type === 'list_relationship' || f.type === 'attachment' || f.type === 'users') continue;
    const v = f.value;
    if (v === undefined || v === null || v === '' ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)) {
      continue;
    }
    let writeValue = v;
    if (f.type === 'drop_down' && typeof v === 'object' && v?.orderindex !== undefined) {
      writeValue = v.orderindex;
    }
    if (f.type === 'labels' && Array.isArray(v)) {
      writeValue = v.map((opt) => (typeof opt === 'string' ? opt : opt.id)).filter(Boolean);
      if (!writeValue.length) continue;
    }
    await setCustomField(destTaskId, fid, writeValue).catch((e) =>
      console.error(`[${label}] propagate field "${f.name}" failed:`, e.message),
    );
  }
}

async function setCustomField(taskId, fieldId, value) {
  return clickupFetch(`/task/${taskId}/field/${fieldId}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}


// ─── Description builder ───────────────────────────────────────────────

function buildDescription(state) {
  const lines = [
    `# Website Content — ${state.displayName || state.clientId}`,
    '',
    `**Client ID:** ${state.clientId}`,
    `**Subject type:** ${state.subjectType}`,
    `**Submitted:** ${new Date().toISOString()}`,
    '',
    '_Full structured payload is stored in Supabase. This description shows a human-readable summary._',
    '',
  ];
  const skip = new Set(['clientId', 'subjectType', 'displayName', 'currentStage', 'completedStages', 'submitting', 'submitted', 'submitError', 'clickupTaskId']);
  for (const [k, v] of Object.entries(state)) {
    if (skip.has(k)) continue;
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    lines.push(`## ${humanize(k)}`);
    lines.push(formatValue(v));
    lines.push('');
  }
  return lines.join('\n').slice(0, 8000);
}

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function formatValue(v) {
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === 'object') {
      return v.map((item, i) => `${i + 1}. ` + Object.entries(item).map(([k, x]) => `**${humanize(k)}:** ${x}`).join(' · ')).join('\n');
    }
    return v.map((x) => `- ${x}`).join('\n');
  }
  if (v && typeof v === 'object') {
    return Object.entries(v).map(([k, x]) => `- **${humanize(k)}:** ${x ?? ''}`).join('\n');
  }
  return String(v);
}


// ─── Sheets webhook ────────────────────────────────────────────────────

async function syncSheets({ state, clientId, submittedAt, supabaseRowId }) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return;
  // Strip clientId from payload (already at top level)
  const { clientId: _drop, ...payload } = state || {};
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form: 'website_content',
      client_id: clientId,
      submitted_at: submittedAt,
      supabase_row_id: supabaseRowId,
      payload,
    }),
  });
}
