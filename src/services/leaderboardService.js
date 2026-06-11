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
