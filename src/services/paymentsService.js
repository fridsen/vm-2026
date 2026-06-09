// Payment tracking service (Level 2 — manual Swish, informational only).
//
// Players pay the entry fee manually in the Swish app; this only records who
// has paid. Marking payments is restricted to admins (email allowlist in the
// `admins` table) and enforced by RLS — the client calls are best-effort and
// will error for non-admins, which the UI handles by only showing the control
// to admins.

import { supabase, unwrap } from './supabaseClient.js';

// Swish payee + fee are not secrets — they're shown to every player.
// Override per deploy with VITE_SWISH_NUMBER; default matches production pot.
export const SWISH_NUMBER =
  import.meta.env?.VITE_SWISH_NUMBER?.trim() || '0708312041';
// Default 200 kr when env is unset (matches onboarding copy). Set VITE_ENTRY_FEE_SEK in .env.local.
const configuredFee = Number(import.meta.env?.VITE_ENTRY_FEE_SEK);
export const ENTRY_FEE_SEK =
  Number.isFinite(configuredFee) && configuredFee > 0 ? configuredFee : 200;

/** Share of gross pot retained for administration before winner payouts. */
export const PRIZE_POOL_ADMIN_FEE_PCT = 5;

export function grossPotSek(entryFeeSek, participantCount) {
  if (!participantCount || !entryFeeSek) return 0;
  return entryFeeSek * participantCount;
}

export function adminFeeSek(entryFeeSek, participantCount) {
  const gross = grossPotSek(entryFeeSek, participantCount);
  return Math.round(gross * (PRIZE_POOL_ADMIN_FEE_PCT / 100));
}

/** Distributable prize pool after the admin fee is deducted. */
export function prizePoolSek(entryFeeSek, participantCount) {
  return grossPotSek(entryFeeSek, participantCount) - adminFeeSek(entryFeeSek, participantCount);
}

// Whether the signed-in user is an admin. Backed by the SECURITY DEFINER
// is_admin() SQL function so the allowlist itself stays private.
export async function fetchIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return Boolean(data);
}

export async function fetchMyPayment(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllPayments() {
  const rows = unwrap(await supabase.from('payments').select('*'));
  // Keyed by user id for easy lookup alongside leaderboard rows.
  const byUser = {};
  for (const r of rows) byUser[r.user_id] = r;
  return byUser;
}

// Admin-only. Upserts the payment row; RLS rejects non-admins.
export async function setPaid(userId, paid, { amountSek, note } = {}) {
  const row = { user_id: userId, paid };
  if (amountSek != null) row.amount_sek = amountSek;
  if (note != null) row.note = note;
  const data = unwrap(
    await supabase
      .from('payments')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single(),
  );
  return data;
}
