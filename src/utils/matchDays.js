import { getMatchDayKey } from './matchSchedule.js';

/** Group matches by calendar day, sorted earliest day first; kickoff order within day. */
export function buildMatchDays(matches) {
  const byDay = new Map();
  for (const match of matches ?? []) {
    const dayKey = getMatchDayKey(match.kickoff);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(match);
  }

  return [...byDay.entries()]
    .map(([dayKey, dayMatches]) => ({
      dayKey,
      date: new Date(`${dayKey}T12:00:00`),
      matches: [...dayMatches].sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}
