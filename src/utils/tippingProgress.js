const TOP_THREE_TOTAL = 3;

export function getTippingProgress({
  matchCount = 0,
  totalMatches = 72,
  rankedGroups = 0,
  totalGroups = 12,
  topThreeFilled = 0,
}) {
  const matchesPct =
    totalMatches > 0 ? Math.round((matchCount / totalMatches) * 100) : 0;
  const groupsPct =
    totalGroups > 0 ? Math.round((rankedGroups / totalGroups) * 100) : 0;
  const topThreePct = Math.round((topThreeFilled / TOP_THREE_TOTAL) * 100);

  const totalItems = totalMatches + totalGroups + TOP_THREE_TOTAL;
  const filledItems = matchCount + rankedGroups + topThreeFilled;
  const overallPct =
    totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  return {
    overallPct,
    matchesPct,
    groupsPct,
    topThreePct,
    matchesDone: matchCount >= totalMatches,
    groupsDone: rankedGroups >= totalGroups,
    topThreeDone: topThreeFilled >= TOP_THREE_TOTAL,
  };
}
