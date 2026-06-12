import { supabase, unwrap } from './supabaseClient.js';

const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');

export async function fetchSyncHealthRows() {
  return unwrap(await supabase.from('sync_health').select('*').order('mode'));
}

/** Trigger a live sync manually (admin recovery). */
export async function triggerLiveSync() {
  if (!FUNCTIONS_BASE) throw new Error('Saknar Supabase URL');
  const res = await fetch(`${FUNCTIONS_BASE}/functions/v1/sync-fixtures?mode=live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}

/** Public health probe — ok for uptime monitors (no auth). */
export async function fetchSyncHealthProbe() {
  if (!FUNCTIONS_BASE) throw new Error('Saknar Supabase URL');
  const res = await fetch(`${FUNCTIONS_BASE}/functions/v1/sync-fixtures?mode=health`);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
