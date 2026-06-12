import { MATCH_DURATION_MS } from './matchSchedule.js';

function allTournamentMatches(groupMatches, knockoutMatches) {
  return [...(groupMatches ?? []), ...(knockoutMatches ?? [])];
}

/** Supports (group, now) legacy calls and (group, knockout, now). */
function resolveMatchArgs(groupMatches, knockoutOrNow = [], now = Date.now()) {
  if (typeof knockoutOrNow === 'number') {
    return { groupMatches, knockoutMatches: [], now: knockoutOrNow };
  }
  return { groupMatches, knockoutMatches: knockoutOrNow ?? [], now };
}

/** True once any match has kicked off or a final score exists. */
export function tournamentMayBeLive(groupMatches, knockoutOrNow = [], now = Date.now()) {
  const args = resolveMatchArgs(groupMatches, knockoutOrNow, now);
  const matches = allTournamentMatches(args.groupMatches, args.knockoutMatches);
  if (!matches.length) return false;
  if (matches.some((m) => m.result != null)) return true;
  return matches.some((m) => args.now >= new Date(m.kickoff).getTime());
}

/** True while at least one match is in the kickoff→FT window without a result yet. */
export function hasMatchInLiveWindow(groupMatches, knockoutOrNow = [], now = Date.now()) {
  const args = resolveMatchArgs(groupMatches, knockoutOrNow, now);
  const matches = allTournamentMatches(args.groupMatches, args.knockoutMatches);
  if (!matches.length) return false;
  return matches.some((m) => {
    if (m.status === 'in_play') return true;
    if (m.result != null || m.status === 'finished') return false;
    const kickoff = new Date(m.kickoff).getTime();
    return args.now >= kickoff && args.now < kickoff + MATCH_DURATION_MS;
  });
}

/** Poll interval while the tournament is active (ms). */
export function liveDataPollIntervalMs(groupMatches, knockoutOrNow = [], now = Date.now()) {
  const args = resolveMatchArgs(groupMatches, knockoutOrNow, now);
  const matches = allTournamentMatches(args.groupMatches, args.knockoutMatches);
  if (!tournamentMayBeLive(args.groupMatches, args.knockoutMatches, args.now)) return null;
  if (matches.some((m) => m.status === 'in_play')) return 15_000;
  return hasMatchInLiveWindow(args.groupMatches, args.knockoutMatches, args.now)
    ? 30_000
    : 60_000;
}
