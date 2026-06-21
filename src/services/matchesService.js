// Service för matcher (både gruppspel och slutspel).
// Reads from `matches` and `knockout_matches`.

import { supabase, unwrap } from './supabaseClient.js';
import { groupMatchScheduleForTeams } from '../data/groupMatchSchedule.js';
import { correctedMatchResult } from '../data/scoreCorrections.js';

export const KNOCKOUT_ROUNDS = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];

function scoresFromRow(r) {
  if (r.home_score == null || r.away_score == null) return null;
  return { home: r.home_score, away: r.away_score };
}

function rowToMatch(r) {
  const rawScores = scoresFromRow(r);
  const scores = rawScores ? correctedMatchResult(r.id, rawScores) : null;
  const isFinished = r.status === 'finished';
  const schedule = groupMatchScheduleForTeams(r.home_team_id, r.away_team_id);

  return {
    id: r.id,
    group: r.group,
    round: r.round,
    kickoff: schedule?.kickoff ?? r.kickoff,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    venue: schedule?.venue ?? r.venue ?? null,
    result: isFinished ? scores : null,
    liveScore: !isFinished && scores ? scores : null,
    liveMinute:
      !isFinished && (r.status === 'in_play' || scores) ? r.live_minute ?? null : null,
    status: r.status,
    broadcastChannel: r.broadcast_channel ?? r.channel ?? r.tv_channel ?? schedule?.channel ?? null,
  };
}

function rowToKnockout(r) {
  const scores = scoresFromRow(r);
  const isFinished = r.status === 'finished';
  return {
    id: r.id,
    round: r.round,
    label: r.label,
    kickoff: r.kickoff,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    homeSource: r.home_source,
    awaySource: r.away_source,
    result: isFinished ? scores : null,
    liveScore: !isFinished && scores ? scores : null,
    liveMinute:
      !isFinished && (r.status === 'in_play' || scores) ? r.live_minute ?? null : null,
    status: r.status,
  };
}

function sortByKickoff(matches) {
  return [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

export async function fetchAllMatches() {
  const rows = unwrap(
    await supabase.from('matches').select('*').order('kickoff'),
  );
  return sortByKickoff(rows.map(rowToMatch));
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
