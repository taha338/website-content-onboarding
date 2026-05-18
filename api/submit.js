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
import { recordAudit } from './audit.js';

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
  if (!['candidate', 'party', 'nonprofit', 'pac'].includes(state.subjectType)) {
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
    await recordAudit(supabase, {
      form: 'website-content', client_id: clientId, stage: 'supabase_insert',
      outcome: 'error', detail: error.message,
    });
    return res.status(500).json({ error: 'Supabase insert failed', detail: error.message });
  }
  await recordAudit(supabase, {
    form: 'website-content', client_id: clientId, stage: 'supabase_insert',
    outcome: 'ok', detail: `row ${row.id}`,
  });

  // Build the ClickUp custom_fields[] array ONCE and persist it to the
  // Supabase row. The Worker's reconcileDownstreamFields cron reads
  // `clickup_fields` to gap-fill anything the best-effort inline sync below
  // drops under ClickUp rate-limiting.
  const errors = [];
  let customFields = [];
  let unresolved = [];
  let fieldFailures = [];
  try {
    const optionsMap = await getDropdownOptionsMap();
    const built = buildCustomFields(state, optionsMap);
    customFields = built.fields;
    unresolved = built.unresolved;
  } catch (e) {
    console.error('[website-content] buildCustomFields failed:', e);
    errors.push({ step: 'build_fields', detail: String(e.message || e) });
  }
  if (unresolved.length) {
    console.warn('[website-content] unresolved dropdown values:', unresolved);
  }
  if (customFields.length) {
    const { error: cfErr } = await supabase
      .from('website_content_submissions')
      .update({ clickup_fields: customFields })
      .eq('id', row.id);
    if (cfErr) console.error('[website-content] clickup_fields persist failed:', cfErr);
  }

  const cuStart = Date.now();
  resetClickupRetryCount();
  try {
    const r = await syncClickUp({ state, clientId, submittedAt, supabaseRowId: row.id, customFields });
    fieldFailures = r.fieldFailures || [];
    const attempts = 1 + getClickupRetryCount();
    const cuTaskId = r.task_id || null;
    await recordAudit(supabase, {
      form: 'website-content', client_id: clientId, stage: 'clickup_sync',
      outcome: 'ok', attempt: attempts, clickup_task_id: cuTaskId,
      duration_ms: Date.now() - cuStart,
      detail: fieldFailures.length
        ? `task created; ${fieldFailures.length} field write(s) failed`
        : 'task created + fields written',
    });
    await supabase.from('website_content_submissions').update({
      clickup_task_id:  cuTaskId,
      clickup_synced_at: new Date().toISOString(),
      clickup_attempts: attempts,
      clickup_error:    fieldFailures.length ? JSON.stringify(fieldFailures).slice(0, 500) : null,
    }).eq('id', row.id);
  } catch (e) {
    console.error('[website-content] ClickUp sync failed:', e);
    errors.push({ step: 'clickup', detail: String(e.message || e) });
    const attempts = 1 + getClickupRetryCount();
    await recordAudit(supabase, {
      form: 'website-content', client_id: clientId, stage: 'clickup_sync',
      outcome: 'error', attempt: attempts, duration_ms: Date.now() - cuStart,
      detail: String(e.message || e),
    });
    await supabase.from('website_content_submissions').update({
      clickup_attempts: attempts,
      clickup_error:    String(e.message || e).slice(0, 500),
    }).eq('id', row.id);
  }

  const sheetStart = Date.now();
  await syncSheets({ state, clientId, submittedAt, supabaseRowId: row.id })
    .then(() => recordAudit(supabase, {
      form: 'website-content', client_id: clientId, stage: 'sheet_log',
      outcome: 'ok', duration_ms: Date.now() - sheetStart,
    }))
    .catch((e) => {
      errors.push({ step: 'sheets', detail: String(e.message || e) });
      return recordAudit(supabase, {
        form: 'website-content', client_id: clientId, stage: 'sheet_log',
        outcome: 'error', duration_ms: Date.now() - sheetStart,
        detail: String(e.message || e),
      });
    });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    id: row.id,
    syncErrors: errors,
    fieldWriteFailures: fieldFailures,
    unresolvedDropdowns: unresolved,
  });
}


// ─── ClickUp helpers ───────────────────────────────────────────────────

// Retry counter — incremented on every 429/5xx retry. syncClickUp() resets it
// before its run and reads it after so the audit log can report total attempts.
let clickupRetryCount = 0;
export function resetClickupRetryCount() { clickupRetryCount = 0; }
export function getClickupRetryCount() { return clickupRetryCount; }

async function clickupFetch(path, opts = {}) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN not set');
  const MAX_ATTEMPTS = 4; // 1 initial + 3 retries
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const r = await fetch(`https://api.clickup.com/api/v2${path}`, {
      ...opts,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(opts.headers || {}),
      },
    });
    if (r.ok) return r.json();
    // Retry on 429 (rate limit) and 5xx (transient server errors). Honor the
    // Retry-After header when present, otherwise exponential backoff (1s/2s/4s
    // capped at 5s) — deliberately slowing down to stay under ClickUp's limit.
    if ((r.status === 429 || r.status >= 500) && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(r.headers.get('Retry-After'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : Math.min(1000 * 2 ** (attempt - 1), 5000);
      console.warn(`[clickup] ${r.status} on ${path} — retry ${attempt}/${MAX_ATTEMPTS - 1} after ${waitMs}ms`);
      clickupRetryCount++;
      await new Promise((res) => setTimeout(res, waitMs));
      continue;
    }
    const txt = await r.text();
    throw new Error(`ClickUp ${r.status} ${path}: ${txt.slice(0, 300)}`);
  }
  throw new Error(`ClickUp request failed after ${MAX_ATTEMPTS} attempts: ${path}`);
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

// Find the Worker-W3 stub task in the form list for this client.
// W3 pre-creates one task per form list at status 'to do' with Client ID +
// Linked Client set. We patch that stub instead of creating a duplicate.
async function findStubByClientId(listId, clientId) {
  const result = await clickupFetch(
    `/list/${listId}/task?include_closed=true&subtasks=false&page=0`
  );
  const tasks = result.tasks || [];
  for (const t of tasks) {
    if (t.parent) continue;
    const cf = (t.custom_fields || []).find(
      (f) => f.name === 'Client ID' && String(f.value || '').trim() === clientId,
    );
    if (cf) return t;
  }
  return null;
}

async function syncClickUp({ state, clientId, submittedAt, supabaseRowId, customFields }) {
  const displayName = state.displayName || state.candidateName || state.partyName || clientId;
  const taskName    = `${displayName} (${clientId}) — Website Content`;

  const activeClientTask = await findActiveClientByClientId(clientId).catch(() => null);
  // No description dump — all data lives in structured custom fields now.
  const description = '';

  // customFields is built + persisted to the Supabase row by the caller, so
  // the Worker reconciler can heal anything dropped by the write loop below.

  // Prefer the W3-created stub if it exists — patch it instead of creating
  // a duplicate. Falls back to create-new for paths where W3 didn't run.
  const stub = await findStubByClientId(PRIMARY_LIST_ID, clientId).catch(() => null);
  let newTask;
  if (stub) {
    newTask = stub;
    await clickupFetch(`/task/${newTask.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: taskName, description }),
    }).catch((e) => console.error('[website-content] stub rename failed:', e.message));
    await clickupFetch(`/task/${newTask.id}/tag/subject:${state.subjectType}`, {
      method: 'POST',
    }).catch((e) => console.error('[website-content] stub tag failed:', e.message));
  } else {
    // Step 1: create task WITHOUT inline custom_fields. ClickUp's inline
    // custom_fields array silently drops the FIRST ~25-28 entries when more
    // are sent — see docs/clickup-custom-fields.md §6.
    newTask = await clickupFetch(`/list/${PRIMARY_LIST_ID}/task`, {
      method: 'POST',
      body: JSON.stringify({
        name: taskName,
        description,
        status: 'to do',
        tags: [`subject:${state.subjectType}`],
      }),
    });
  }

  // Step 2: write each custom field individually. Failures isolated.
  const fieldFailures = [];
  for (const cf of customFields) {
    try {
      await clickupFetch(`/task/${newTask.id}/field/${cf.id}`, {
        method: 'POST',
        body: JSON.stringify({ value: cf.value }),
      });
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

  // Propagate workspace-shared fields (Client ID + every populated value on
  // the AC master) onto the new form-list task. Replaces Worker automation F0.
  const formWrittenFieldIds = new Set(customFields.map((c) => c.id));
  await propagateWorkspaceFields({
    sourceTask: activeClientTask,
    destTaskId: newTask.id,
    clientId,
    skipFieldIds: formWrittenFieldIds,
    label: 'website-content',
  });

  if (activeClientTask) {
    // Active Clients "Subject Type" dropdown is known to have Candidate (0) +
    // Party (1) only; Nonprofit + PAC options must be added in the ClickUp
    // UI. Until then, only write the field for candidate/party so we don't
    // clobber with a bogus orderindex.
    const subjectOrderIndex =
      state.subjectType === 'party'     ? 1 :
      state.subjectType === 'candidate' ? 0 : null;
    const updates = [
      ...(subjectOrderIndex !== null
        ? [{ fid: ACTIVE_CLIENTS_FIELD_IDS['Subject Type'], value: subjectOrderIndex }]
        : []),
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

    // If all 3 form Submitted-At dates are now non-null on the master,
    // advance status to "all forms received".
    await maybeAdvanceAllFormsReceived(activeClientTask, { website_content: true })
      .catch((e) => console.error('[website-content] status advance failed:', e.message));
  }

  // Flip the form-list task's own status to 'submitted' so ClickUp emits a
  // taskStatusUpdated webhook → Worker F0 + W5. Without this the task
  // stays at 'to do' and downstream automations never fire.
  await clickupFetch(`/task/${newTask.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'submitted' }),
  }).catch((e) => console.error('[website-content] status flip to submitted failed:', e.message));

  return { task_id: newTask.id, active_client_id: activeClientTask?.id || null, fieldFailures };
}

async function maybeAdvanceAllFormsReceived(activeClientTask, justWrote) {
  const get = (name) => (activeClientTask.custom_fields || []).find((f) => f.name === name)?.value;
  const f1 = justWrote.campaign_intake || get('Campaign Intake Submitted At');
  const f2 = justWrote.brand_onboarding || get('Brand Onboarding Submitted At');
  const f3 = justWrote.website_content || get('Website Content Submitted At');
  if (!(f1 && f2 && f3)) return;
  const target = process.env.AC_ALL_FORMS_STATUS || 'all forms received';
  const current = activeClientTask.status?.status || '';
  if (current.toLowerCase() === target.toLowerCase()) return;
  await clickupFetch(`/task/${activeClientTask.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: target }),
  });
}

async function setCustomField(taskId, fieldId, value) {
  return clickupFetch(`/task/${taskId}/field/${fieldId}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

// Propagate workspace-shared custom fields from the AC master onto a new
// form-list task. Always writes Client ID. Then, for every populated field
// on the AC master (skipping form-managed fields, attachments, relationships,
// and users), POSTs the same value onto the dest task. Failures are logged,
// never thrown. Replaces Worker automation F0.
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
