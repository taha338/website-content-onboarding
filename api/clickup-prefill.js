/**
 * GET /api/clickup-prefill?clientId=<id>  — Form 3 (Website Content)
 *
 * Pre-fills from:
 *   1. Active Clients master row (ClickUp)
 *   2. Form 2 brand_submissions (Supabase) — logo, colors, fonts, candidate basics
 *   3. Form 1 campaign_intakes (Supabase) — voice/tone, mission, slogan if captured
 *
 * Required env vars:
 *   - CLICKUP_API_TOKEN
 *   - SUPABASE_URL
 *   - SUPABASE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js';

const FIELDS = {
  clientId:       'Client ID',
  tradeName:      'DBA / Trade Name*',
  primaryName:    'Primary Contact Name*',
  primaryEmail:   'Primary Contact Email*',
  primaryPhone:   'Primary Contact Phone*',
  secondaryName:  'Secondary Contact Name',
  secondaryEmail: 'Secondary Contact Email',
  secondaryRole:  'Secondary Contact Role',
  commPref:       'Communication Preference*',
  packageSel:     'Package Selected**',
  industry:       'Industry / Niche',
  subjectType:    'Subject Type',
  form1RowId:     'Form 1 Supabase Row ID',
  form2RowId:     'Form 2 Supabase Row ID',
  form3RowId:     'Form 3 Supabase Row ID',
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
    return res.status(500).json({ error: 'CLICKUP_API_TOKEN not configured' });
  }

  try {
    // ── 1. Active Clients master ──
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
    const match = (data.tasks || []).find((t) =>
      (t.custom_fields || []).some(
        (cf) => cf.name?.toLowerCase().trim() === FIELDS.clientId.toLowerCase().trim()
          && String(cf.value || '').toLowerCase() === clientId.toLowerCase()
      )
    );
    if (!match) {
      return res.status(200).json({ found: false });
    }

    const cfs = match.custom_fields || [];
    const subjectType = findFieldValue(cfs, FIELDS.subjectType);
    const form1RowId  = findFieldValue(cfs, FIELDS.form1RowId);
    const form2RowId  = findFieldValue(cfs, FIELDS.form2RowId);

    const payload = {
      found: true,
      taskId:   match.id,
      taskName: match.name,
      taskUrl:  match.url,
      clientId:  findFieldValue(cfs, FIELDS.clientId),
      tradeName: findFieldValue(cfs, FIELDS.tradeName),
      subjectType: typeof subjectType === 'string' ? subjectType.toLowerCase() : null,
      contact: {
        name:           findFieldValue(cfs, FIELDS.primaryName),
        email:          findFieldValue(cfs, FIELDS.primaryEmail),
        phone:          findFieldValue(cfs, FIELDS.primaryPhone),
        secondaryName:  findFieldValue(cfs, FIELDS.secondaryName),
        secondaryEmail: findFieldValue(cfs, FIELDS.secondaryEmail),
        secondaryRole:  findFieldValue(cfs, FIELDS.secondaryRole),
      },
      meta: {
        communicationPreference: findFieldValue(cfs, FIELDS.commPref),
        packageSelected:         findFieldValue(cfs, FIELDS.packageSel),
        industry:                findFieldValue(cfs, FIELDS.industry),
      },
      siblingForms: { form1RowId, form2RowId },
      brand:    null,
      campaign: null,
    };

    // ── 2. Cross-form Supabase lookups ──
    const supabaseUrl = process.env.SUPABASE_URL;
    const secretKey   = process.env.SUPABASE_SECRET_KEY;
    if (supabaseUrl && secretKey) {
      const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });
      const lookups = [];
      if (form2RowId) {
        lookups.push(
          supabase.from('brand_submissions')
            .select('subject_type, candidate_name, candidate_office, candidate_state, candidate_district, election_year, party_affiliation, race_focus, candidate_type, party_name, party_acronym, party_type, party_scope, party_state, party_founded_year, brand_core, sub_direction, logo_type, existing_logo_url, color_primary, color_secondary, color_accent, color_background, color_text, color_highlight, font_heading, font_body, backgrounds, policy_priorities')
            .eq('id', form2RowId)
            .maybeSingle()
            .then(({ data }) => { if (data) payload.brand = data; })
            .catch(() => {})
        );
      }
      if (form1RowId) {
        lookups.push(
          supabase.from('campaign_intakes')
            .select('id, subject_type, payload')
            .eq('id', form1RowId)
            .maybeSingle()
            .then(({ data }) => {
              if (!data) return;
              const p = data.payload || {};
              payload.campaign = {
                displayName:     p.displayName || null,
                voiceTone:       p.voiceTone || null,
                voiceToneNotes:  p.voiceToneNotes || null,
                primaryDomain:   p.primaryDomain || null,
                socialHandles:   p.socialHandles || null,
                campaignSlogan:  p.workingCampaignSlogan || p.campaignSlogan || null,
              };
            })
            .catch(() => {})
        );
      }
      await Promise.all(lookups);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err?.message || err) });
  }
}
