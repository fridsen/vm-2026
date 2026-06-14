import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { getMatchState, MATCH_STATE } from './matchSchedule.js';

/** Short team name for teletext index lines (Figma-style). */
export function abbrevTeamName(name, maxLen = 5) {
  if (!name) return '???';
  const stripped = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen);
}

export function formatTeletextMatchDate(kickoffIso) {
  const date = new Date(kickoffIso);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function formatTeletextScore(match) {
  if (match.result != null) {
    return `${match.result.home}-${match.result.away}`;
  }
  if (match.liveScore != null) {
    return `${match.liveScore.home}-${match.liveScore.away}`;
  }
  return 'X-X';
}

export const MALSERVICE_ROW = {
  LIVE: 'live',
  FINISHED: 'finished',
  UPCOMING: 'upcoming',
};

/** Row variant for teletext målservice (377): finished → cyan teams + score; live → white score + green kickoff; upcoming → X-X + green kickoff. */
export function getMalserviceRowVariant(match, now = Date.now()) {
  const state = getMatchState(match, now);
  if (state === MATCH_STATE.LIVE) return MALSERVICE_ROW.LIVE;
  if (state === MATCH_STATE.FINISHED) return MALSERVICE_ROW.FINISHED;
  return MALSERVICE_ROW.UPCOMING;
}

export function formatMalserviceKickoff(kickoffIso) {
  return format(new Date(kickoffIso), 'HH:mm', { locale: sv });
}

/** Final score for finished rows — never X-X. */
export function formatMalserviceFinishedScore(match) {
  if (match.result != null) {
    return `${match.result.home}-${match.result.away}`;
  }
  if (match.liveScore != null) {
    return `${match.liveScore.home}-${match.liveScore.away}`;
  }
  return '–';
}

const MALSERVICE_STATE_RANK = {
  [MALSERVICE_ROW.LIVE]: 0,
  [MALSERVICE_ROW.FINISHED]: 1,
  [MALSERVICE_ROW.UPCOMING]: 2,
};

export function sortMalserviceMatches(matches, now = Date.now()) {
  return [...(matches ?? [])].sort((a, b) => {
    const rankA = MALSERVICE_STATE_RANK[getMalserviceRowVariant(a, now)];
    const rankB = MALSERVICE_STATE_RANK[getMalserviceRowVariant(b, now)];
    if (rankA !== rankB) return rankA - rankB;
    return a.kickoff.localeCompare(b.kickoff);
  });
}

export function teletextDisplayName(profile, user) {
  const raw =
    profile?.display_name ||
    profile?.first_name ||
    user?.email?.split('@')[0] ||
    'DU';
  return raw.trim().toUpperCase();
}

/** Leading space before 1–9 so rank labels align with double digits (Figma: " 1." vs "10."). */
export function formatTeletextRank(rank) {
  const label = `${rank}.`;
  return rank < 10 ? ` ${label}` : label;
}

/** Swedish copy for teletext rank change since the last finished match. */
export function formatRankMovementPhrase(delta) {
  if (delta == null || delta === 0) {
    return 'Oförändrad placering sedan förra matchen';
  }
  if (delta > 0) {
    const noun = delta === 1 ? 'plats' : 'platser';
    return `Du har klättrat ${delta} ${noun} sedan förra matchen`;
  }
  const steps = Math.abs(delta);
  const noun = steps === 1 ? 'plats' : 'platser';
  return `Du har tappat ${steps} ${noun} sedan förra matchen`;
}
