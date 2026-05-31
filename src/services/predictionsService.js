// Predictions-service.
//
// Stores one row per (user_id, kind, key) in Supabase. The hooks consume the
// hydrated shape returned by `loadAll`, which mirrors what the prototype's
// localStorage backend used to return so existing UI code is unchanged.

import { supabase, unwrap } from './supabaseClient.js';

// Empty prediction shape consumed by hooks/UI. Inlined here (rather than
// imported from data/) so there are no UI imports of mock data.
const EMPTY = {
  matches: {},
  groupStandings: {},
  topScorers: [],
  knockout: {
    R32: {},
    R16: {},
    QF: {},
    SF: {},
    BRONZE: null,
    FINAL: null,
    finalists: [],
  },
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
      case 'top_scorers':
        out.topScorers = r.value;
        break;
      case 'knockout_advance': {
        const [round, matchId] = r.key.split(':');
        if (round && matchId) {
          out.knockout[round] = out.knockout[round] || {};
          out.knockout[round][matchId] = r.value;
        }
        break;
      }
      case 'bronze':
        out.knockout.BRONZE = r.value;
        break;
      case 'final':
        out.knockout.FINAL = r.value;
        break;
      case 'finalists':
        out.knockout.finalists = r.value;
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

// ─── Matcher ──────────────────────────────────────────────────────

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

// ─── Gruppslutställning ───────────────────────────────────────────

export async function fetchGroupStandingPredictions(userId) {
  return (await loadAll(userId)).groupStandings;
}

export async function saveGroupStandingPrediction(userId, group, teamIds) {
  await upsertPrediction(userId, 'group_standing', group, teamIds);
  return (await loadAll(userId)).groupStandings;
}

// ─── Skytteliga ──────────────────────────────────────────────────

export async function fetchTopScorerPrediction(userId) {
  return (await loadAll(userId)).topScorers;
}

export async function saveTopScorerPrediction(userId, playerIds) {
  await upsertPrediction(userId, 'top_scorers', 'top_scorers', playerIds);
  return (await loadAll(userId)).topScorers;
}

// ─── Slutspel ────────────────────────────────────────────────────

export async function fetchKnockoutPredictions(userId) {
  return (await loadAll(userId)).knockout;
}

export async function saveKnockoutAdvance(userId, round, matchId, teamId) {
  // Round is encoded into the key so the lock function (which only sees
  // (kind, key)) can derive it without a join.
  const composite = `${round}:${matchId}`;
  if (teamId == null) {
    await deletePrediction(userId, 'knockout_advance', composite);
  } else {
    await upsertPrediction(userId, 'knockout_advance', composite, teamId);
  }
  return (await loadAll(userId)).knockout;
}

export async function saveBronzeWinner(userId, teamId) {
  if (teamId == null) {
    await deletePrediction(userId, 'bronze', 'bronze');
  } else {
    await upsertPrediction(userId, 'bronze', 'bronze', teamId);
  }
  return (await loadAll(userId)).knockout;
}

export async function saveWorldCupWinner(userId, teamId) {
  if (teamId == null) {
    await deletePrediction(userId, 'final', 'final');
  } else {
    await upsertPrediction(userId, 'final', 'final', teamId);
  }
  return (await loadAll(userId)).knockout;
}

export async function saveFinalists(userId, teamIds) {
  await upsertPrediction(userId, 'finalists', 'finalists', teamIds);
  return (await loadAll(userId)).knockout;
}

// ─── Utilities ───────────────────────────────────────────────────

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

// ─── Migration helper ────────────────────────────────────────────
//
// Lifts predictions saved in localStorage by the prototype phase into
// Supabase under the authenticated user's id. Idempotent: storage key is
// cleared after a successful upsert. Safe to call on every sign-in — the
// upsert absorbs duplicates.

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
  if (Array.isArray(parsed.topScorers) && parsed.topScorers.length) {
    rows.push({
      user_id: authUserId,
      kind: 'top_scorers',
      key: 'top_scorers',
      value: parsed.topScorers,
    });
  }
  for (const round of ['R32', 'R16', 'QF', 'SF']) {
    for (const [matchId, teamId] of Object.entries(parsed.knockout?.[round] || {})) {
      rows.push({
        user_id: authUserId,
        kind: 'knockout_advance',
        key: `${round}:${matchId}`,
        value: teamId,
      });
    }
  }
  if (parsed.knockout?.BRONZE) {
    rows.push({
      user_id: authUserId,
      kind: 'bronze',
      key: 'bronze',
      value: parsed.knockout.BRONZE,
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
  if (Array.isArray(parsed.knockout?.finalists) && parsed.knockout.finalists.length) {
    rows.push({
      user_id: authUserId,
      kind: 'finalists',
      key: 'finalists',
      value: parsed.knockout.finalists,
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
