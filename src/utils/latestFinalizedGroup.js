import { GROUPS } from '../data/teams.js';

const MATCHES_PER_GROUP = 6;

/** Most recently finalized group (all 6 matches finished). */
export function latestFinalizedGroup(matches) {
  const stats = new Map();
  for (const group of GROUPS) {
    stats.set(group, { finished: 0, lastKickoff: '' });
  }

  for (const match of matches ?? []) {
    if (!match.group || match.status !== 'finished') continue;
    const row = stats.get(match.group);
    if (!row) continue;
    row.finished += 1;
    if (match.kickoff > row.lastKickoff) row.lastKickoff = match.kickoff;
  }

  const complete = GROUPS.filter((g) => stats.get(g)?.finished >= MATCHES_PER_GROUP);
  if (!complete.length) return null;

  return complete.sort(
    (a, b) => stats.get(b).lastKickoff.localeCompare(stats.get(a).lastKickoff),
  )[0];
}
