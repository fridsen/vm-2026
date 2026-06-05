// Supabase Auth wrapper.
//
// Thin, framework-free API so the React useAuth hook stays tiny and the
// same functions can be reused from scripts/tests.

import { getAuthRedirectUrl } from '../utils/authRedirect.js';
import { supabase, unwrap } from './supabaseClient.js';

// Stable id we use to scope localStorage entries written by the prototype.
// The auth migration helper (see predictionsService.js) reads from this
// scope on first sign-in to pull legacy predictions into Supabase.
export const LEGACY_LOCAL_USER_ID = 'user-1';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ? { user: data.session.user } : { user: null };
}

export function onAuthStateChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  });
  if (error) throw error;
}

// Email + password sign-up. First/last name are stashed in user_metadata so
// they survive the (optional) email-confirmation round-trip; the profile row
// is created from them once a session exists. Returns whether a session was
// established immediately (false ⇒ email confirmation is required).
export async function signUpWithPassword({ email, password, firstName, lastName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      data: { first_name: firstName, last_name: lastName },
    },
  });
  if (error) throw error;
  return { hasSession: Boolean(data.session) };
}

export async function signInWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl(),
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getAuthRedirectUrl() },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function isProfileComplete(profile) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

// Create/update the profile. Accepts either a plain display name (legacy
// callers) or a { firstName, lastName } object; display_name is always set
// (and kept NOT NULL) as "First Last" for the leaderboard.
export async function upsertProfile(userId, nameOrParts) {
  const parts =
    typeof nameOrParts === 'string'
      ? { displayName: nameOrParts }
      : nameOrParts || {};
  const firstName = (parts.firstName ?? '').trim();
  const lastName = (parts.lastName ?? '').trim();
  const displayName =
    (parts.displayName ?? '').trim() || [firstName, lastName].filter(Boolean).join(' ');

  const row = { id: userId, display_name: displayName };
  if (firstName) row.first_name = firstName;
  if (lastName) row.last_name = lastName;
  if (parts.email) row.email = parts.email;

  const data = unwrap(
    await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single(),
  );
  return data;
}

// Self-set acknowledgement that the player has seen the Swish instructions.
// NOT a confirmation of payment (that stays admin-only in public.payments).
export async function setPaymentAck(userId) {
  const data = unwrap(
    await supabase
      .from('profiles')
      .update({ payment_ack: true })
      .eq('id', userId)
      .select()
      .single(),
  );
  return data;
}
