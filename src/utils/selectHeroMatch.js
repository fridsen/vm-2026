import {
  MATCH_DURATION_MS,
  MATCH_STATE,
  compareMatchesByKickoff,
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
    .sort(compareMatchesByKickoff)[0];
}

function pickMostRecentFinished(matches, now) {
  return matches
    .filter((m) => isRecentlyFinished(m, now))
    .sort((a, b) => finishedAtMs(b) - finishedAtMs(a))[0];
}

function pickNextUpcoming(matches, now) {
  return matches
    .filter((m) => getMatchState(m, now) === MATCH_STATE.UPCOMING)
    .sort(compareMatchesByKickoff)[0];
}

function heroPeerFilter(variant, now) {
  switch (variant) {
    case HERO_VARIANT.LIVE:
      return (m) => getMatchState(m, now) === MATCH_STATE.LIVE;
    case HERO_VARIANT.UPCOMING:
      return (m) => getMatchState(m, now) === MATCH_STATE.UPCOMING;
    case HERO_VARIANT.RECENT_FINISHED:
      return (m) => isRecentlyFinished(m, now);
    default:
      return () => false;
  }
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

/** Same priority as selectHeroMatch, but includes every match at that kickoff slot. */
export function selectHeroMatches(matches, now = Date.now()) {
  const primary = selectHeroMatch(matches, now);
  if (!primary) return null;

  const filter = heroPeerFilter(primary.variant, now);
  const peers = (matches ?? [])
    .filter((m) => m.kickoff === primary.match.kickoff && filter(m))
    .sort(compareMatchesByKickoff);

  return {
    matches: peers.length > 0 ? peers : [primary.match],
    variant: primary.variant,
  };
}
