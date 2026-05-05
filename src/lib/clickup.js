/**
 * Helpers for the Vercel API routes that proxy ClickUp.
 */
export async function fetchPrefill(clientId) {
  if (!clientId) return null;
  const res = await fetch(`/api/clickup-prefill?clientId=${encodeURIComponent(clientId)}`);
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    throw new Error(`Prefill failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export function readClientIdFromUrl() {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('client_id') || p.get('clientId') || '';
}
