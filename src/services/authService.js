// Supabase Auth wrapper.
//
// Thin, framework-free API so the React useAuth hook stays tiny and the
// same functions can be reused from scripts/tests.

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
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
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

export async function upsertProfile(userId, displayName) {
  const row = { id: userId, display_name: displayName };
  const data = unwrap(
    await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single(),
  );
  return data;
}
