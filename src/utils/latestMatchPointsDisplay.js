/** Per-user latest-match points for display (single value or split by same-kickoff slot). */
export function latestPointsDisplayForUser(userId, totals, breakdown, matchCount) {
  if (!totals || matchCount < 1) return null;

  if (breakdown?.[userId]) {
    return breakdown[userId];
  }

  if (matchCount > 1) {
    return Array.from({ length: matchCount }, () => 0);
  }

  return [totals[userId] ?? 0];
}
