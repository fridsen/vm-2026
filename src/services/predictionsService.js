// Predictions-service.
//
// Stores one row per (user_id, kind, key) in Supabase. In-scope kinds:
// match, group_standing, final (VM top 3 as json array). Legacy knockout/top_scorer rows
// may remain in the DB for history but are not loaded or saved (server RLS).

import { supabase, unwrap } from './supabaseClient.js';
import { normalizeMatchPrediction } from '../utils/matchPredictionDisplay.js';
import { normalizeTopThree } from '../utils/topThree.js';

const EMPTY = {
  matches: {},
  groupStandings: {},
  knockout: { topThree: [null, null, null] },
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
        out.matches[r.key] = normalizeMatchPrediction(r.value);
        break;
      case 'group_standing':
        out.groupStandings[r.key] = r.value;
        break;
      case 'final':
        out.knockout.topThree = normalizeTopThree(r.value);
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

/** Match predictions for one user on a calendar day (YYYY-MM-DD, Europe/Stockholm). */
export async function fetchUserMatchPredictionsForDay(userId, dayKey) {
  const { data, error } = await supabase.rpc('fn_user_match_predictions_for_day', {
    p_user_id: userId,
    p_day: dayKey,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    matchId: row.match_id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    kickoff: row.kickoff,
    prediction: row.prediction,
  }));
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

export async function saveWorldCupTopThree(userId, topThree) {
  const normalized = normalizeTopThree(topThree);
  if (!normalized.some(Boolean)) {
    await deletePrediction(userId, 'final', 'final');
  } else {
    await upsertPrediction(userId, 'final', 'final', normalized);
  }
  return (await loadAll(userId)).knockout;
}

/** @deprecated Use saveWorldCupTopThree */
export async function saveWorldCupWinner(userId, teamId) {
  if (teamId == null) {
    return saveWorldCupTopThree(userId, [null, null, null]);
  }
  return saveWorldCupTopThree(userId, [teamId, null, null]);
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
  const topThree = normalizeTopThree(
    parsed.knockout?.topThree ?? parsed.knockout?.FINAL,
  );
  if (topThree.some(Boolean)) {
    rows.push({
      user_id: authUserId,
      kind: 'final',
      key: 'final',
      value: topThree,
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
