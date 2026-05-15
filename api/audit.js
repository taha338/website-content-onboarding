/**
 * Automation audit logging — durable Supabase row + real-time Sheet append.
 *
 * Every stage of /api/submit (supabase_insert, clickup_sync, sheet_log) calls
 * recordAudit() so there's a queryable history in Supabase `automation_audit`
 * AND a live view in the audit Google Sheet.
 *
 * Best-effort: never throws. A failed audit write must not break a submission.
 *
 * Env: AUDIT_SHEET_WEBHOOK_URL (optional Apps Script /exec endpoint).
 */

export async function recordAudit(supabase, entry) {
  const row = {
    source: 'vercel-submit',
    form: entry.form ?? null,
    client_id: entry.client_id ?? null,
    stage: entry.stage ?? null,
    outcome: entry.outcome ?? null,
    attempt: entry.attempt ?? 1,
    detail: entry.detail != null ? String(entry.detail).slice(0, 1000) : null,
    clickup_task_id: entry.clickup_task_id ?? null,
    duration_ms: entry.duration_ms ?? null,
  };

  // 1) Durable log — Supabase.
  try {
    await supabase.from('automation_audit').insert([row]);
  } catch (e) {
    console.error('[audit] supabase insert failed:', e?.message || e);
  }

  // 2) Real-time view — Google Sheet via Apps Script webhook.
  const url = process.env.AUDIT_SHEET_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    } catch (e) {
      console.error('[audit] sheet post failed:', e?.message || e);
    }
  }
}
