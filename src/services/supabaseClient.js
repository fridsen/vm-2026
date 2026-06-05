// Singleton Supabase client.
//
// After the cutover, the app always talks to Supabase — there's no longer
// a feature flag. If the env vars are missing the app fails fast at import
// time so deployment misconfiguration surfaces loudly instead of silently
// falling back to mock data.

import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env?.VITE_SUPABASE_URL || '';
const ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!URL || !ANON) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. ' +
      'Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(URL, ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Recover faster when iOS Safari leaves an orphaned navigator.lock.
    lockAcquireTimeout: 10_000,
  },
});

export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
