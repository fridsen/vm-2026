// Service för matcher (både gruppspel och slutspel).
// Reads from `matches` and `knockout_matches`.

import { supabase, unwrap } from './supabaseClient.js';

export const KNOCKOUT_ROUNDS = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];

function rowToMatch(r) {
  const result =
    r.home_score != null && r.away_score != null
      ? { home: r.home_score, away: r.away_score }
      : null;
  return {
    id: r.id,
    group: r.group,
    round: r.round,
    kickoff: r.kickoff,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    result,
    status: r.status,
  };
}

function rowToKnockout(r) {
  const result =
    r.home_score != null && r.away_score != null
      ? { home: r.home_score, away: r.away_score }
      : null;
  return {
    id: r.id,
    round: r.round,
    label: r.label,
    kickoff: r.kickoff,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    homeSource: r.home_source,
    awaySource: r.away_source,
    result,
    status: r.status,
  };
}

export async function fetchAllMatches() {
  const rows = unwrap(
    await supabase.from('matches').select('*').order('kickoff'),
  );
  return rows.map(rowToMatch);
}

export async function fetchMatchesByGroup(group) {
  const rows = unwrap(
    await supabase
      .from('matches')
      .select('*')
      .eq('group', group)
      .order('kickoff'),
  );
  return rows.map(rowToMatch);
}

export async function fetchMatch(id) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMatch(data) : null;
}

export async function fetchFirstKickoff() {
  const rows = unwrap(
    await supabase.from('matches').select('kickoff').order('kickoff').limit(1),
  );
  return rows[0]?.kickoff ?? null;
}

export async function fetchRoundFirstKickoff(round) {
  const rows = unwrap(
    await supabase
      .from('matches')
      .select('kickoff')
      .eq('round', round)
      .order('kickoff')
      .limit(1),
  );
  return rows[0]?.kickoff ?? null;
}

export async function fetchKnockoutMatches() {
  const rows = unwrap(
    await supabase.from('knockout_matches').select('*').order('kickoff'),
  );
  return rows.map(rowToKnockout);
}

export async function fetchKnockoutByRound(round) {
  const rows = unwrap(
    await supabase
      .from('knockout_matches')
      .select('*')
      .eq('round', round)
      .order('kickoff'),
  );
  return rows.map(rowToKnockout);
}

export async function fetchKnockoutFirstKickoff(round) {
  const rows = unwrap(
    await supabase
      .from('knockout_matches')
      .select('kickoff')
      .eq('round', round)
      .order('kickoff')
      .limit(1),
  );
  return rows[0]?.kickoff ?? null;
}
