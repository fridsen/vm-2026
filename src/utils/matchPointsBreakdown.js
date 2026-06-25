import { scoreGroupMatch } from './scoring.js';

const MAX_PER_MATCH = {
  sign: 3,
  homeGoals: 1,
  awayGoals: 1,
  exact: 1,
};

export const BREAKDOWN_ROWS = [
  { key: 'sign', label: 'Tecken' },
  { key: 'homeGoals', label: 'H. Mål' },
  { key: 'awayGoals', label: 'B. Mål' },
  { key: 'exact', label: 'Bonus' },
];

/** Dashboard total-points categories (Figma 513:12933). */
export const TOTAL_POINTS_ROWS = [
  { key: 'sign', label: 'Rätt tecken', dotClass: 'is-dark' },
  { key: 'goals', label: 'Rätt antal mål', dotClass: 'is-mid' },
  { key: 'exact', label: 'Bonuspoäng', dotClass: 'is-light' },
  { key: 'groups', label: 'Poäng grupper', dotClass: 'is-faint' },
];

function emptyBreakdown() {
  return { sign: 0, homeGoals: 0, awayGoals: 0, exact: 0 };
}

/**
 * Aggregate match scoring breakdown across finished group matches.
 * `possible` counts max points per dimension for every finished match;
 * `earned` sums the user's breakdown from scoreGroupMatch.
 */
export function aggregateMatchPointsBreakdown(matches, predictions, groupPointsEarned = 0) {
  const earned = emptyBreakdown();
  const possible = emptyBreakdown();
  const matchPreds = predictions?.matches ?? {};

  for (const match of matches ?? []) {
    if (match.status !== 'finished' || match.result == null) continue;

    for (const key of Object.keys(MAX_PER_MATCH)) {
      possible[key] += MAX_PER_MATCH[key];
    }

    const pred = matchPreds[match.id];
    const { breakdown } = scoreGroupMatch(pred, match.result);
    for (const key of Object.keys(earned)) {
      earned[key] += breakdown[key] ?? 0;
    }
  }

  const rows = BREAKDOWN_ROWS.map(({ key, label }) => ({
    key,
    label,
    earned: earned[key],
    possible: possible[key],
    pct: possible[key] > 0 ? Math.min(100, (earned[key] / possible[key]) * 100) : 0,
  }));

  const goalsEarned = earned.homeGoals + earned.awayGoals;
  const totalRows = TOTAL_POINTS_ROWS.map(({ key, label, dotClass }) => ({
    key,
    label,
    dotClass,
    earned:
      key === 'groups'
        ? Math.max(0, Math.round(Number(groupPointsEarned) || 0))
        : key === 'goals'
          ? goalsEarned
          : key === 'sign'
            ? earned.sign
            : earned.exact,
  }));

  const earnedTotal = Object.values(earned).reduce((sum, n) => sum + n, 0);

  const finishedCount =
    matches?.filter((m) => m.status === 'finished' && m.result != null).length ?? 0;
  return { earned, possible, rows, totalRows, earnedTotal, finishedCount };
}
