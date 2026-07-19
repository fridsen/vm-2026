// Leaderboard-service.
// Reads from the `leaderboard` view defined in
// supabase/migrations/20260601000000_initial_schema.sql.

import { supabase, unwrap } from './supabaseClient.js';
import { rankForUser } from '../utils/leaderboardMovement.js';

function rowToEntry(r) {
  return {
    userId: r.user_id,
    name: r.name,
    points: r.points,
    matchPoints: r.match_points,
    groupPoints: r.group_points,
    knockoutPoints: r.knockout_points,
    topScorerPoints: r.top_scorer_points,
    paid: r.paid ?? false,
  };
}

export async function fetchLeaderboard() {
  const rows = unwrap(
    await supabase
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false }),
  );
  return rows.map(rowToEntry);
}

export async function fetchLeaderboardRank(userId) {
  const entries = await fetchLeaderboard();
  return rankForUser(entries, userId);
}

export async function fetchUserEntry(userId) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry(data) : null;
}

/** Points per player for finished matches (leaderboard Senast column). */
export async function fetchLatestMatchPoints(matchIds) {
  const ids = (Array.isArray(matchIds) ? matchIds : [matchIds]).filter(Boolean);
  if (!ids.length) return { totals: {}, breakdown: {} };

  const maps = await Promise.all(
    ids.map(async (matchId) => {
      const { data, error } = await supabase.rpc('fn_match_points_for_leaderboard', {
        p_match_id: matchId,
      });
      if (error) throw error;
      const map = {};
      for (const row of data ?? []) {
        map[row.user_id] = row.points;
      }
      return map;
    }),
  );

  const allUserIds = new Set();
  for (const map of maps) {
    for (const userId of Object.keys(map)) {
      allUserIds.add(userId);
    }
  }

  const breakdown = {};
  const totals = {};
  for (const userId of allUserIds) {
    const parts = maps.map((map) => map[userId] ?? 0);
    breakdown[userId] = parts;
    totals[userId] = parts.reduce((sum, points) => sum + points, 0);
  }

  return { totals, breakdown };
}

/** Points per player for one finalized group (leaderboard Grupper Senast column). */
export async function fetchLatestGroupPoints(group) {
  if (!group) return {};
  const { data, error } = await supabase.rpc('fn_group_points_for_leaderboard', {
    p_group: group,
  });
  if (error) throw error;
  const map = {};
  for (const row of data ?? []) {
    map[row.user_id] = row.points;
  }
  return map;
}

/** Points from the most recently finished podium match (bronze or final slots). */
export async function fetchLatestPodiumPoints() {
  const { data, error } = await supabase.rpc('fn_latest_podium_points_for_leaderboard');
  if (error) throw error;
  const map = {};
  for (const row of data ?? []) {
    map[row.user_id] = row.points;
  }
  return map;
}
