import { format } from 'date-fns';
import { MATCH_STATE, getMatchDayKey, getMatchState } from './matchSchedule.js';

const STATE_RANK = {
  [MATCH_STATE.LIVE]: 0,
  [MATCH_STATE.UPCOMING]: 1,
  [MATCH_STATE.FINISHED]: 2,
};

export function sortMatchesByState(matches, now) {
  return [...matches].sort((a, b) => {
    const rankA = STATE_RANK[getMatchState(a, now)];
    const rankB = STATE_RANK[getMatchState(b, now)];
    if (rankA !== rankB) return rankA - rankB;
    return a.kickoff.localeCompare(b.kickoff);
  });
}

/** Today's matches, or next upcoming if none today. */
export function selectCarouselMatches(matches, now) {
  const todayKey = format(new Date(now), 'yyyy-MM-dd');
  const todays = matches.filter((m) => getMatchDayKey(m.kickoff) === todayKey);

  if (todays.length > 0) {
    return { matches: sortMatchesByState(todays, now), isToday: true };
  }

  const upcoming = matches.filter((m) => getMatchState(m, now) === MATCH_STATE.UPCOMING);
  return {
    matches: sortMatchesByState(upcoming, now).slice(0, 6),
    isToday: false,
  };
}
