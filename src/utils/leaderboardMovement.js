/** Latest finished group match id (kickoff order), or null. */
export function latestFinishedMatchId(matches) {
  const finished = (matches ?? [])
    .filter((m) => m.status === 'finished')
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  return finished[0]?.id ?? null;
}

/** Signature of all finished matches — changes when any group or KO match completes. */
export function finishedMatchesSignature(groupMatches, knockoutMatches) {
  const ids = [
    ...(groupMatches ?? [])
      .filter((m) => m.status === 'finished')
      .map((m) => `g:${m.id}`),
    ...(knockoutMatches ?? [])
      .filter((m) => m.status === 'finished')
      .map((m) => `k:${m.id}`),
  ].sort();
  return ids.join(',');
}

export function sortLeaderboardEntries(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return (a.name ?? '').localeCompare(b.name ?? '', 'sv');
  });
}

/** Competition ranking: tied players share a rank; next rank skips (1,1,1,4,…). */
export function ranksFromEntries(entries) {
  const sorted = sortLeaderboardEntries(entries);
  const ranks = {};
  let rank = 1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i].points < sorted[i - 1].points) {
      rank = i + 1;
    }
    ranks[sorted[i].userId] = rank;
  }
  return ranks;
}

export function rankForUser(entries, userId) {
  if (!userId) return null;
  return ranksFromEntries(entries)[userId] ?? null;
}

function movementsBetween(priorRanks, currentRanks) {
  const movements = {};
  if (!priorRanks) return movements;
  for (const [userId, rank] of Object.entries(currentRanks)) {
    const prev = priorRanks[userId];
    if (prev == null || prev === rank) continue;
    movements[userId] = prev - rank;
  }
  return movements;
}

/**
 * Rank movement caused by the latest finished match. Positive = moved up.
 * Derived from current totals minus per-player points on that match (no local storage).
 */
export function rankMovementsFromLatestMatch(entries, latestPointsByUser = {}) {
  if (!entries?.length) return {};

  const priorEntries = entries.map((entry) => ({
    ...entry,
    points: entry.points - (latestPointsByUser[entry.userId] ?? 0),
  }));

  return movementsBetween(ranksFromEntries(priorEntries), ranksFromEntries(entries));
}
