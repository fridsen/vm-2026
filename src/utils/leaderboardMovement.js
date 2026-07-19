import { compareMatchesByKickoff, isKnockoutMatch } from './matchSchedule.js';

/** Finished matches at the most recent kickoff slot (stable order). */
export function latestFinishedMatches(matches) {
  const finished = (matches ?? []).filter((m) => m.status === 'finished');
  if (!finished.length) return [];

  const sorted = [...finished].sort(compareMatchesByKickoff);
  const latestKickoff = sorted[sorted.length - 1].kickoff;
  return finished
    .filter((m) => m.kickoff === latestKickoff)
    .sort(compareMatchesByKickoff);
}

/** @deprecated Prefer latestFinishedMatches when multiple games share a kickoff. */
export function latestFinishedMatchId(matches) {
  return latestFinishedMatches(matches)[0]?.id ?? null;
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

function sortEntriesByScore(entries, scoreKey) {
  return [...(entries ?? [])].sort((a, b) => {
    const scoreA = a[scoreKey] ?? 0;
    const scoreB = b[scoreKey] ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
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

/** Competition ranks for a list already sorted by the active score column. */
export function ranksFromOrderedEntries(entries, scoreKey = 'points') {
  const ranks = {};
  let rank = 1;
  for (let i = 0; i < (entries ?? []).length; i += 1) {
    const score = entries[i][scoreKey] ?? 0;
    if (i > 0 && score < (entries[i - 1][scoreKey] ?? 0)) {
      rank = i + 1;
    }
    ranks[entries[i].userId] = rank;
  }
  return ranks;
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
 * Rank movement from a per-user score delta on `scoreKey`. Positive = moved up.
 */
export function rankMovementsFromScoreDelta(
  entries,
  deltaByUser = {},
  scoreKey = 'points',
) {
  if (!entries?.length) return {};

  const priorEntries = entries.map((entry) => ({
    ...entry,
    [scoreKey]: (entry[scoreKey] ?? 0) - (deltaByUser[entry.userId] ?? 0),
  }));

  return movementsBetween(
    ranksFromOrderedEntries(sortEntriesByScore(priorEntries, scoreKey), scoreKey),
    ranksFromOrderedEntries(sortEntriesByScore(entries, scoreKey), scoreKey),
  );
}

/**
 * Rank movement caused by the latest finished match. Positive = moved up.
 * Derived from current totals minus per-player points on that match (no local storage).
 */
export function rankMovementsFromLatestMatch(entries, latestPointsByUser = {}) {
  return rankMovementsFromScoreDelta(entries, latestPointsByUser, 'points');
}

/**
 * Totalt movement from whichever scoring event is newest: group match or podium slot.
 * `latestPodiumPoints` is only the points from the most recently finished podium match.
 */
export function rankMovementsForTotalt(
  entries,
  {
    matches,
    latestMatchPoints,
    latestMatchKickoff,
    latestPodiumPoints,
    latestPodiumKickoff,
  } = {},
) {
  const matchKickoff = latestMatchKickoff ?? null;
  const podiumKickoff = latestPodiumKickoff ?? null;
  const podiumIsNewer =
    podiumKickoff != null &&
    (matchKickoff == null || podiumKickoff.localeCompare(matchKickoff) > 0);

  if (podiumIsNewer) {
    return rankMovementsFromScoreDelta(entries, latestPodiumPoints ?? {}, 'points');
  }

  if (matchKickoff != null) {
    return rankMovementsFromScoreDelta(entries, latestMatchPoints ?? {}, 'points');
  }

  const knockouts = (matches ?? []).filter(isKnockoutMatch);
  if (latestFinishedMatches(knockouts).length > 0 && latestPodiumPoints) {
    return rankMovementsFromScoreDelta(entries, latestPodiumPoints, 'points');
  }

  return {};
}
