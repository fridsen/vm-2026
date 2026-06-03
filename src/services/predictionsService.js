// Predictions-service.
//
// Stores one row per (user_id, kind, key) in Supabase. In-scope kinds:
// match, group_standing, final (VM winner). Legacy knockout/top_scorer rows
// may still be loaded for display but cannot be saved (server RLS).

import { supabase, unwrap } from './supabaseClient.js';

const EMPTY = {
  matches: {},
  groupStandings: {},
  knockout: { FINAL: null },
};

function emptyPredictions() {
  return structuredClone(EMPTY);
}

async function loadAll(userId) {
  const rows = unwrap(
    await supabase
      .from('predictions')
      .select('kind, key, value')
      .eq('user_id', userId),
  );
  const out = emptyPredictions();
  for (const r of rows) {
    switch (r.kind) {
      case 'match':
        out.matches[r.key] = r.value;
        break;
      case 'group_standing':
        out.groupStandings[r.key] = r.value;
        break;
      case 'final':
        out.knockout.FINAL = r.value;
        break;
      default:
        break;
    }
  }
  return out;
}

async function upsertPrediction(userId, kind, key, value) {
  const { error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, kind, key, value },
      { onConflict: 'user_id,kind,key' },
    );
  if (error) throw error;
}

async function deletePrediction(userId, kind, key) {
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('key', key);
  if (error) throw error;
}

export async function fetchMatchPredictions(userId) {
  return (await loadAll(userId)).matches;
}

export async function saveMatchPrediction(
  userId,
  matchId,
  { home, away, outcome },
) {
  const isEmpty = home === '' || home == null || away === '' || away == null;
  if (isEmpty) {
    await deletePrediction(userId, 'match', matchId);
  } else {
    const value = { home: Number(home), away: Number(away) };
    if (outcome === '1' || outcome === 'X' || outcome === '2') {
      value.outcome = outcome;
    }
    await upsertPrediction(userId, 'match', matchId, value);
  }
  return (await loadAll(userId)).matches;
}

export async function fetchGroupStandingPredictions(userId) {
  return (await loadAll(userId)).groupStandings;
}

export async function saveGroupStandingPrediction(userId, group, teamIds) {
  await upsertPrediction(userId, 'group_standing', group, teamIds);
  return (await loadAll(userId)).groupStandings;
}

export async function saveWorldCupWinner(userId, teamId) {
  if (teamId == null) {
    await deletePrediction(userId, 'final', 'final');
  } else {
    await upsertPrediction(userId, 'final', 'final', teamId);
  }
  return (await loadAll(userId)).knockout;
}

export async function fetchAllPredictions(userId) {
  return loadAll(userId);
}

export async function countMatchPredictions(userId) {
  const { count, error } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'match');
  if (error) throw error;
  return count || 0;
}

const STORAGE_KEY = (userId) => `vm2026:predictions:${userId}`;

export async function migrateLocalStorageToSupabase(localUserId, authUserId) {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY(localUserId));
  } catch {
    return { migrated: 0 };
  }
  if (!raw) return { migrated: 0 };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { migrated: 0 };
  }

  const rows = [];
  for (const [matchId, value] of Object.entries(parsed.matches || {})) {
    rows.push({ user_id: authUserId, kind: 'match', key: matchId, value });
  }
  for (const [group, value] of Object.entries(parsed.groupStandings || {})) {
    rows.push({
      user_id: authUserId,
      kind: 'group_standing',
      key: group,
      value,
    });
  }
  if (parsed.knockout?.FINAL) {
    rows.push({
      user_id: authUserId,
      kind: 'final',
      key: 'final',
      value: parsed.knockout.FINAL,
    });
  }

  if (rows.length === 0) return { migrated: 0 };

  const { error } = await supabase
    .from('predictions')
    .upsert(rows, { onConflict: 'user_id,kind,key' });
  if (error) throw error;

  localStorage.removeItem(STORAGE_KEY(localUserId));
  return { migrated: rows.length };
}
