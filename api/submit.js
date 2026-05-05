/**
 * POST /api/submit
 *
 * Body: { state }
 *
 * 1. Insert main row into Supabase `website_content_submissions`.
 * 2. Best-effort ClickUp task creation in the Website Content Form list.
 * 3. Best-effort Apps Script Sheets webhook.
 *
 * Required env vars:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - CLICKUP_API_TOKEN
 * Optional:
 *   - CLICKUP_WEBSITE_CONTENT_LIST_ID  default: 901113630895
 *   - SHEETS_WEBHOOK_URL
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { state = {} } = body || {};
  const clientId = (state.clientId || '').toString().trim();
  if (!clientId || !/^[A-Za-z0-9_-]{1,40}$/.test(clientId)) {
    return res.status(400).json({ error: 'Valid clientId required' });
  }
  if (!['candidate', 'party'].includes(state.subjectType)) {
    return res.status(400).json({ error: 'Subject type required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured.' });
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: row, error } = await supabase
    .from('website_content_submissions')
    .insert([{
      client_id:        clientId,
      clickup_task_id:  state.clickupTaskId || null,
      submitted_at:     new Date().toISOString(),
      subject_type:     state.subjectType,
      payload:          state,
    }])
    .select()
    .single();
  if (error) {
    return res.status(500).json({ error: 'Supabase insert failed', detail: error.message });
  }

  const errors = [];
  await syncClickUp({ state, clientId }).catch((e) => errors.push({ step: 'clickup', detail: String(e.message || e) }));
  await syncSheets({ state, clientId }).catch((e) => errors.push({ step: 'sheets', detail: String(e.message || e) }));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, id: row.id, syncErrors: errors });
}

async function syncClickUp({ state, clientId }) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) return;
  const listId = process.env.CLICKUP_WEBSITE_CONTENT_LIST_ID || '901113630895';
  await fetch(`https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: `${clientId} — Website Content (v0 submission)`,
      status: 'complete',
      description: `Submitted via website-content.vercel.app at ${new Date().toISOString()}.\n\nSee Supabase row for full payload.`,
    }),
  });
}

async function syncSheets({ state, clientId }) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form: 'website_content',
      client_id: clientId,
      submitted_at: new Date().toISOString(),
      payload: state,
    }),
  });
}
