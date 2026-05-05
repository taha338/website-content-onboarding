/**
 * GET /api/clickup-prefill?clientId=<id>
 *
 * Server-side proxy to ClickUp. Fetches the master Active Clients task
 * matching `Client ID = <id>` and returns a sanitized prefill payload
 * the form can use to auto-populate Section A and B.
 *
 * Required env vars (set in Vercel project settings):
 *   - CLICKUP_API_TOKEN        — ClickUp personal API token (server-side only)
 *   - CLICKUP_ACTIVE_CLIENTS_LIST_ID  — defaults to 901113554047 if not set
 *
 * Optional env var overrides for custom field names (defaults shown):
 *   - CLICKUP_FIELD_CLIENT_ID         "Client ID"
 *   - CLICKUP_FIELD_TRADE_NAME        "DBA / Trade Name*"
 *   - CLICKUP_FIELD_PRIMARY_NAME      "Primary Contact Name*"
 *   - CLICKUP_FIELD_PRIMARY_EMAIL     "Primary Contact Email*"
 *   - CLICKUP_FIELD_PRIMARY_PHONE     "Primary Contact Phone*"
 */

const FIELDS = {
  clientId:    process.env.CLICKUP_FIELD_CLIENT_ID    || 'Client ID',
  tradeName:   process.env.CLICKUP_FIELD_TRADE_NAME   || 'DBA / Trade Name*',
  primaryName: process.env.CLICKUP_FIELD_PRIMARY_NAME || 'Primary Contact Name*',
  primaryEmail:process.env.CLICKUP_FIELD_PRIMARY_EMAIL|| 'Primary Contact Email*',
  primaryPhone:process.env.CLICKUP_FIELD_PRIMARY_PHONE|| 'Primary Contact Phone*',
};

function findFieldValue(customFields, label) {
  if (!Array.isArray(customFields) || !label) return null;
  const m = customFields.find((f) => f?.name?.toLowerCase().trim() === label.toLowerCase().trim());
  if (!m) return null;
  if (m.type === 'drop_down' && m.value !== undefined && m.value !== null) {
    const opt = m.type_config?.options?.[m.value];
    return opt?.name ?? null;
  }
  return m.value ?? null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { clientId } = req.query;
  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ error: 'clientId query parameter is required' });
  }
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(clientId)) {
    return res.status(400).json({ error: 'Invalid clientId format' });
  }

  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_ACTIVE_CLIENTS_LIST_ID || '901113554047';
  if (!token) {
    return res.status(500).json({ error: 'CLICKUP_API_TOKEN not configured on the server' });
  }

  // ClickUp doesn't support filtering by custom field value via REST in a clean
  // way without iterating, so we fetch the list and find the matching task.
  // For 12 tasks this is fine; if the list grows beyond a few hundred we should
  // switch to the Search API or maintain a separate "active clients" table.
  try {
    const url = `https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task?include_closed=true&subtasks=false`;
    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Authorization: token, Accept: 'application/json' },
    });
    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(upstream.status).json({ error: 'ClickUp API failed', detail: body.slice(0, 500) });
    }
    const data = await upstream.json();
    const tasks = data.tasks || [];
    const match = tasks.find((t) =>
      (t.custom_fields || []).some(
        (cf) => cf.name?.toLowerCase().trim() === FIELDS.clientId.toLowerCase().trim()
          && String(cf.value || '').toLowerCase() === clientId.toLowerCase()
      )
    );
    if (!match) {
      return res.status(200).json({ found: false });
    }
    const cfs = match.custom_fields || [];
    const payload = {
      found: true,
      taskId: match.id,
      taskName: match.name,
      taskUrl: match.url,
      clientId: findFieldValue(cfs, FIELDS.clientId),
      tradeName: findFieldValue(cfs, FIELDS.tradeName),
      contact: {
        name:  findFieldValue(cfs, FIELDS.primaryName),
        email: findFieldValue(cfs, FIELDS.primaryEmail),
        phone: findFieldValue(cfs, FIELDS.primaryPhone),
      },
    };
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err?.message || err) });
  }
}
