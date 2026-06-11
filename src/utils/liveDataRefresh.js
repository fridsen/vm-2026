import { MATCH_DURATION_MS } from './matchSchedule.js';

/** True once any group match has kicked off or a final score exists. */
export function tournamentMayBeLive(groupMatches, now = Date.now()) {
  if (!groupMatches?.length) return false;
  if (groupMatches.some((m) => m.result != null)) return true;
  return groupMatches.some((m) => now >= new Date(m.kickoff).getTime());
}

/** True while at least one match is in the kickoff→FT window without a result yet. */
export function hasMatchInLiveWindow(groupMatches, now = Date.now()) {
  if (!groupMatches?.length) return false;
  return groupMatches.some((m) => {
    if (m.status === 'in_play') return true;
    if (m.result != null || m.status === 'finished') return false;
    const kickoff = new Date(m.kickoff).getTime();
    return now >= kickoff && now < kickoff + MATCH_DURATION_MS;
  });
}

/** Poll interval while the tournament is active (ms). */
export function liveDataPollIntervalMs(groupMatches, now = Date.now()) {
  if (!tournamentMayBeLive(groupMatches, now)) return null;
  if (groupMatches.some((m) => m.status === 'in_play')) return 15_000;
  return hasMatchInLiveWindow(groupMatches, now) ? 30_000 : 60_000;
}
