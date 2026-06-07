/**
 * Export all user predictions to a local JSON file (off-site backup).
 * Optionally also store a labelled snapshot in prediction_snapshots.
 *
 * Usage:
 *   node scripts/backup-predictions.mjs
 *   node scripts/backup-predictions.mjs --snapshot
 *   node scripts/backup-predictions.mjs --snapshot-only
 */

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVE_KINDS = ['match', 'group_standing', 'final'];

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

function timestampLabel() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function groupByUser(predictions) {
  const byUser = new Map();
  for (const row of predictions) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, { matches: {}, groupStandings: {}, topThree: null });
    }
    const bucket = byUser.get(row.user_id);
    if (row.kind === 'match') bucket.matches[row.key] = row.value;
    else if (row.kind === 'group_standing') bucket.groupStandings[row.key] = row.value;
    else if (row.kind === 'final') bucket.topThree = row.value;
  }
  return byUser;
}

const args = new Set(process.argv.slice(2));
const snapshotOnly = args.has('--snapshot-only');
const withSnapshot = snapshotOnly || args.has('--snapshot');

const fileEnv = loadEnv();
const url = fileEnv.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const key = fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchAllRows(buildQuery) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

let predictions;
let profiles;
try {
  [predictions, profiles] = await Promise.all([
    fetchAllRows(() =>
      supabase
        .from('predictions')
        .select('user_id, kind, key, value, updated_at')
        .in('kind', ACTIVE_KINDS)
        .order('user_id')
        .order('kind')
        .order('key'),
    ),
    fetchAllRows(() =>
      supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, created_at')
        .order('display_name'),
    ),
  ]);
} catch (err) {
  console.error('Failed to load backup data:', err.message ?? err);
  process.exit(1);
}

const profileById = new Map(profiles.map((p) => [p.id, p]));
const byUser = groupByUser(predictions);

const users = [...byUser.entries()].map(([userId, tips]) => {
  const profile = profileById.get(userId);
  return {
    userId,
    displayName: profile?.display_name ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    tips,
  };
});

const usersWithoutTips = profiles
  .filter((p) => !byUser.has(p.id))
  .map((p) => ({
    userId: p.id,
    displayName: p.display_name,
    firstName: p.first_name,
    lastName: p.last_name,
    tips: null,
  }));

let snapshotResult = null;
if (withSnapshot) {
  const label = `manual_${timestampLabel()}`;
  const { data, error } = await supabase.rpc('fn_backup_all_predictions', { p_label: label });
  if (error) {
    console.error('Failed to create DB snapshot:', error.message);
    process.exit(1);
  }
  snapshotResult = data;
}

const exportPayload = {
  exportedAt: new Date().toISOString(),
  summary: {
    predictionRows: predictions.length,
    usersWithTips: users.length,
    totalProfiles: profiles.length,
    usersWithoutTips: usersWithoutTips.length,
  },
  snapshot: snapshotResult,
  users: [...users, ...usersWithoutTips],
  rawPredictions: predictions,
};

if (!snapshotOnly) {
  const backupsDir = resolve(root, 'backups');
  mkdirSync(backupsDir, { recursive: true });
  const filePath = resolve(backupsDir, `predictions-${timestampLabel()}.json`);
  writeFileSync(filePath, `${JSON.stringify(exportPayload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${filePath}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      predictionRows: exportPayload.summary.predictionRows,
      usersWithTips: exportPayload.summary.usersWithTips,
      snapshot: snapshotResult,
    },
    null,
    2,
  ),
);
