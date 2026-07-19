/** @typedef {'total' | 'latest'} LeaderboardSortKey */

/**
 * Sort leaderboard rows. Default tie-breaker is score column, then name.
 * @param {Array<{ userId: string, name?: string, points: number, matchPoints?: number, groupPoints?: number }>} entries
 * @param {{ key: LeaderboardSortKey, dir: 'asc' | 'desc' }} sort
 * @param {Record<string, number>} [latestPointsByUser]
 * @param {{ scoreKey?: 'points' | 'matchPoints' | 'groupPoints' | 'knockoutPoints' }} [options]
 */
export function sortLeaderboardEntries(
  entries,
  sort,
  latestPointsByUser = {},
  { scoreKey = 'points' } = {},
) {
  const factor = sort.dir === 'asc' ? 1 : -1;

  return [...(entries ?? [])].sort((a, b) => {
    if (sort.key === 'latest') {
      const latestA = latestPointsByUser[a.userId] ?? 0;
      const latestB = latestPointsByUser[b.userId] ?? 0;
      if (latestA !== latestB) return factor * (latestA - latestB);
    }

    const scoreA = a[scoreKey] ?? 0;
    const scoreB = b[scoreKey] ?? 0;
    if (scoreA !== scoreB) {
      const totalFactor = sort.key === 'total' ? factor : -1;
      return totalFactor * (scoreA - scoreB);
    }

    return (a.name ?? '').localeCompare(b.name ?? '', 'sv');
  });
}

export function nextLeaderboardSort(current, key) {
  if (current.key === key) {
    return { key, dir: current.dir === 'desc' ? 'asc' : 'desc' };
  }
  return { key, dir: 'desc' };
}
