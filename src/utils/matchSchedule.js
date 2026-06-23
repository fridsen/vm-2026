import { format } from 'date-fns';
import { GROUPS } from '../data/teams.js';

/** Approximate match length (90 min + extra time / halftime). */
export const MATCH_DURATION_MS = 105 * 60 * 1000;

export const MATCH_STATE = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  FINISHED: 'finished',
};

export function getMatchState(match, now) {
  if (match.status === 'in_play') return MATCH_STATE.LIVE;
  if (match.status === 'finished' || match.result != null) {
    return MATCH_STATE.FINISHED;
  }
  if (match.liveScore != null) return MATCH_STATE.LIVE;
  if (match.status === 'postponed' || match.status === 'cancelled') {
    return MATCH_STATE.UPCOMING;
  }
  const kickoff = new Date(match.kickoff).getTime();
  if (now < kickoff) return MATCH_STATE.UPCOMING;
  if (now < kickoff + MATCH_DURATION_MS) return MATCH_STATE.LIVE;
  // Sync lag: past the match window but DB still has no result — don't show FT.
  if (match.status === 'scheduled' && match.result == null && match.liveScore == null) {
    return MATCH_STATE.LIVE;
  }
  return MATCH_STATE.FINISHED;
}

const HALFTIME_BREAK_MS = 15 * 60 * 1000;
const FIRST_HALF_MS = 45 * 60 * 1000;

/** Live minute from provider sync, or kickoff estimate with halftime pause. */
export function liveMatchMinute(match, now = Date.now()) {
  if (match.liveMinute != null) {
    return Math.min(120, Math.max(1, match.liveMinute));
  }

  const kickoff = new Date(match.kickoff).getTime();
  const elapsedMs = now - kickoff;
  if (elapsedMs < FIRST_HALF_MS) {
    return Math.max(1, Math.floor(elapsedMs / 60000));
  }
  if (elapsedMs < FIRST_HALF_MS + HALFTIME_BREAK_MS) {
    return 45;
  }
  return Math.min(90, Math.floor((elapsedMs - HALFTIME_BREAK_MS) / 60000));
}

/** Display score from football-data.org sync or local schedule fallback. */
export function displayScore(match) {
  if (match.result != null) {
    return { home: match.result.home, away: match.result.away };
  }
  if (match.liveScore != null) {
    return { home: match.liveScore.home, away: match.liveScore.away };
  }
  return null;
}

export function getMatchDayKey(kickoffIso) {
  return format(new Date(kickoffIso), 'yyyy-MM-dd');
}

/** Stable kickoff order: time, then group, then id. */
export function compareMatchesByKickoff(a, b) {
  const byKickoff = a.kickoff.localeCompare(b.kickoff);
  if (byKickoff !== 0) return byKickoff;
  const byGroup = (a.group ?? '').localeCompare(b.group ?? '');
  if (byGroup !== 0) return byGroup;
  return a.id.localeCompare(b.id);
}

/**
 * Flatten matches in the same order they're shown in the group-by-group
 * lists (Dashboard PreWcView and MatchesPage): groups in alphabetical
 * order, kickoff order within each group. Used by the prediction sheet's
 * prev/next arrows so navigation matches what the user sees on screen.
 */
export function flattenMatchesByGroup(matches) {
  const byGroup = new Map();
  for (const g of GROUPS) byGroup.set(g, []);
  for (const m of matches) {
    if (byGroup.has(m.group)) byGroup.get(m.group).push(m);
  }
  for (const g of GROUPS) {
    byGroup.get(g).sort(compareMatchesByKickoff);
  }
  return GROUPS.flatMap((g) => byGroup.get(g) || []);
}

/** Compute group standings from a list of group matches with results. */
export function computeGroupStandings(matches, teams) {
  const table = new Map();
  for (const team of teams) {
    table.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      form: [],
    });
  }
  const sorted = [...matches].sort(compareMatchesByKickoff);
  for (const m of sorted) {
    if (!m.result) continue;
    const home = table.get(m.homeTeamId);
    const away = table.get(m.awayTeamId);
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.gf += m.result.home;
    home.ga += m.result.away;
    away.gf += m.result.away;
    away.ga += m.result.home;
    if (m.result.home > m.result.away) {
      home.won++;
      away.lost++;
      home.points += 3;
      home.form.push('W');
      away.form.push('L');
    } else if (m.result.home < m.result.away) {
      away.won++;
      home.lost++;
      away.points += 3;
      home.form.push('L');
      away.form.push('W');
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
      home.form.push('D');
      away.form.push('D');
    }
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  }
  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name);
  });
}
