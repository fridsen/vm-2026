import { MATCH_STATE, getMatchState } from './matchSchedule.js';

/** Minutes after kickoff before we expect synced scores during live play. */
export const STALE_LIVE_GRACE_MS = 12 * 60 * 1000;

/** Match is live (by time or status) but DB has no score yet — sync likely lagging. */
export function isStaleLiveMatch(match, now = Date.now()) {
  if (getMatchState(match, now) !== MATCH_STATE.LIVE) return false;
  if (match.liveScore != null || match.result != null) return false;
  const kickoff = new Date(match.kickoff).getTime();
  if (Number.isNaN(kickoff)) return false;
  return now >= kickoff + STALE_LIVE_GRACE_MS;
}

export function staleLiveMatches(matches, now = Date.now()) {
  return (matches ?? []).filter((m) => isStaleLiveMatch(m, now));
}

export function hasStaleLiveMatches(groupMatches, knockoutMatches, now = Date.now()) {
  return (
    staleLiveMatches(groupMatches, now).length > 0 ||
    staleLiveMatches(knockoutMatches, now).length > 0
  );
}
