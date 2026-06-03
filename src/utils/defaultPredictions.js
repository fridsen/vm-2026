// Default prediction values applied server-side after the global deadline.
// Keep in sync with MinaTipsPage / PredictionSheet / VinnareTab behaviour.

import { teamIdsInGroup } from '../services/teamsService.js';

export const DEFAULT_MATCH = { home: 0, away: 0, outcome: 'X' };

/** Full group order when the user has not ranked anyone (fixture iteration order). */
export function defaultGroupStanding(group, matches) {
  return teamIdsInGroup(group, matches);
}

/** First team in Swedish alphabetical order (Vinnare tab when none selected). */
export function defaultWinnerTeamId(teams) {
  if (!teams?.length) return null;
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  return sorted[0]?.id ?? null;
}
