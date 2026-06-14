import {
  MATCH_DURATION_MS,
  MATCH_STATE,
  getMatchState,
} from './matchSchedule.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export const HERO_VARIANT = {
  LIVE: 'live',
  RECENT_FINISHED: 'recent-finished',
  UPCOMING: 'upcoming',
};

function finishedAtMs(match) {
  return new Date(match.kickoff).getTime() + MATCH_DURATION_MS;
}

function isRecentlyFinished(match, now) {
  if (getMatchState(match, now) !== MATCH_STATE.FINISHED || match.result == null) {
    return false;
  }
  return now - finishedAtMs(match) <= ONE_HOUR_MS;
}

function pickEarliestLive(matches, now) {
  return matches
    .filter((m) => getMatchState(m, now) === MATCH_STATE.LIVE)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
}

function pickMostRecentFinished(matches, now) {
  return matches
    .filter((m) => isRecentlyFinished(m, now))
    .sort((a, b) => finishedAtMs(b) - finishedAtMs(a))[0];
}

function pickNextUpcoming(matches, now) {
  return matches
    .filter((m) => getMatchState(m, now) === MATCH_STATE.UPCOMING)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
}

function isKickoffWithin30Minutes(match, now) {
  const kickoffMs = new Date(match.kickoff).getTime();
  const untilKickoff = kickoffMs - now;
  return untilKickoff >= 0 && untilKickoff <= THIRTY_MINUTES_MS;
}

/**
 * Select a single hero match for the dashboard.
 * Priority: live → upcoming within 30m → finished within 1h → next upcoming.
 */
export function selectHeroMatch(matches, now = Date.now()) {
  const list = matches ?? [];

  const live = pickEarliestLive(list, now);
  if (live) {
    return { match: live, variant: HERO_VARIANT.LIVE };
  }

  const upcoming = pickNextUpcoming(list, now);
  if (upcoming && isKickoffWithin30Minutes(upcoming, now)) {
    return { match: upcoming, variant: HERO_VARIANT.UPCOMING };
  }

  const recentFinished = pickMostRecentFinished(list, now);
  if (recentFinished) {
    return { match: recentFinished, variant: HERO_VARIANT.RECENT_FINISHED };
  }

  if (upcoming) {
    return { match: upcoming, variant: HERO_VARIANT.UPCOMING };
  }

  return null;
}
