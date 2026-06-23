import { MATCH_STATE, compareMatchesByKickoff, getMatchState } from './matchSchedule.js';

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
    return compareMatchesByKickoff(a, b);
  });
}
