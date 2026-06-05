/**
 * Wipe all test users and their data before go-live.
 *
 * 1. Deletes public rows (predictions, payments, profiles, audit/snapshots)
 * 2. Deletes all Supabase Auth users
 *
 * Keeps: admins allowlist, fixtures, teams, matches, etc.
 *
 * Usage: node scripts/reset-test-users.mjs
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const path = resolve(root, '.env.local');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = loadEnv();
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function countTable(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function wipePublicUserData() {
  const zero = '00000000-0000-0000-0000-000000000000';
  const byUserId = ['prediction_events', 'prediction_snapshots', 'payment_reminders', 'predictions', 'payments'];
  for (const table of byUserId) {
    const { error } = await supabase.from(table).delete().neq('user_id', zero);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  const { error: profileError } = await supabase.from('profiles').delete().neq('id', zero);
  if (profileError) throw new Error(`profiles: ${profileError.message}`);
}

async function main() {
  const before = {
    users: (await listAllUsers()).length,
    profiles: await countTable('profiles'),
    predictions: await countTable('predictions'),
    payments: await countTable('payments'),
  };

  console.log('Before:', before);

  if (before.users === 0 && before.profiles === 0 && before.predictions === 0) {
    console.log('Already empty.');
    return;
  }

  console.log('Wiping public user data…');
  await wipePublicUserData();

  const users = await listAllUsers();
  let deleted = 0;
  let failed = 0;

  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`Failed to delete ${user.email ?? user.id}: ${error.message}`);
      failed += 1;
    } else {
      deleted += 1;
    }
  }

  const after = {
    users: (await listAllUsers()).length,
    profiles: await countTable('profiles'),
    predictions: await countTable('predictions'),
    payments: await countTable('payments'),
  };

  console.log(`Deleted ${deleted} auth user(s)${failed ? `, ${failed} failed` : ''}.`);
  console.log('After:', after);

  if (after.users > 0 || after.profiles > 0 || after.predictions > 0 || after.payments > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
