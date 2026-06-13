import { format } from 'date-fns';
import { getMatchDayKey } from './matchSchedule.js';

/** Today's matches sorted chronologically by kickoff. */
export function selectTodayMatches(matches, now = Date.now()) {
  const todayKey = format(new Date(now), 'yyyy-MM-dd');
  return (matches ?? [])
    .filter((m) => getMatchDayKey(m.kickoff) === todayKey)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}
