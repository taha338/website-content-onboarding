/**
 * Operation 1776 — Single-form sync to Google Sheets.
 *
 * One copy of this script lives in each form's bound Sheet:
 *   • Op1776 — Campaign Intake          (tab: Live)
 *   • Op1776 — Political Brand Discovery (tab: Live)
 *   • Op1776 — Website Content          (tab: Live)
 *
 * Receives POST { form, client_id, submitted_at, supabase_row_id, payload }
 * from the Vercel /api/submit route and appends one row to the "Live" tab.
 *
 * (Historical CSVs go in a separate "Historical" tab — untouched by this script.)
 *
 * Setup per Sheet:
 *   1. Tools → Script editor (or Extensions → Apps Script)
 *   2. Paste this whole file
 *   3. Save
 *   4. Deploy → New deployment → type = Web app
 *      • Execute as: Me
 *      • Who has access: Anyone
 *      • Click Deploy → copy the Web app URL
 *   5. Paste that URL into Vercel as `SHEETS_WEBHOOK_URL` env var on the
 *      MATCHING app only:
 *        • Op1776 Campaign Intake sheet → campaign-intake project
 *        • Op1776 Political Brand sheet → political-brand-onboarding-react
 *        • Op1776 Website Content sheet → website-content project
 *   6. Redeploy that Vercel project.
 */

const LIVE_TAB = 'Live';
const HEADER_PREFIX = ['Submitted At', 'Client ID', 'Supabase Row ID', 'Form'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(LIVE_TAB);
    if (!sheet) sheet = ss.insertSheet(LIVE_TAB);

    const flat = flattenObject(body.payload || {});

    // Resolve / extend header row
    let headerRow;
    if (sheet.getLastRow() === 0) {
      headerRow = HEADER_PREFIX.concat(Object.keys(flat).sort());
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const known = new Set(headerRow);
      const newKeys = Object.keys(flat).filter(k => !known.has(k)).sort();
      if (newKeys.length) {
        const startCol = headerRow.length + 1;
        sheet.getRange(1, startCol, 1, newKeys.length).setValues([newKeys]);
        sheet.getRange(1, startCol, 1, newKeys.length).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
        headerRow = headerRow.concat(newKeys);
      }
    }

    const rowValues = headerRow.map(col => {
      switch (col) {
        case 'Submitted At':    return body.submitted_at || new Date().toISOString();
        case 'Client ID':       return body.client_id || '';
        case 'Supabase Row ID': return body.supabase_row_id || '';
        case 'Form':            return body.form || '';
        default: {
          const v = flat[col];
          if (v === null || v === undefined) return '';
          if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
          return v;
        }
      }
    });

    sheet.appendRow(rowValues);
    return jsonResp({ ok: true, tab: LIVE_TAB, row: sheet.getLastRow() });
  } catch (err) {
    return jsonResp({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

function doGet() {
  return jsonResp({ ok: true, message: 'Op1776 form sync — POST only.' });
}

function flattenObject(obj, prefix) {
  prefix = prefix || '';
  const out = {};
  if (obj === null || typeof obj !== 'object') return out;
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const key = prefix ? prefix + '.' + k : k;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(out, flattenObject(val, key));
    } else {
      out[key] = val;
    }
  }
  return out;
}

function jsonResp(obj, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: statusCode || 200 }, obj)))
    .setMimeType(ContentService.MimeType.JSON);
}
