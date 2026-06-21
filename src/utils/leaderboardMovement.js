const STORAGE_KEY = 'vm2026:leaderboardRankSnapshot:v2';

function resultKey(match, prefix = '') {
  const h = match.result?.home ?? 'x';
  const a = match.result?.away ?? 'x';
  return `${prefix}${match.id}:${h}-${a}`;
}

/** Latest finished group match id (kickoff order), or null. */
export function latestFinishedMatchId(matches) {
  const finished = (matches ?? [])
    .filter((m) => m.status === 'finished')
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  return finished[0]?.id ?? null;
}

/** Signature of all finished matches — changes when any match completes or a result is corrected. */
export function finishedMatchesSignature(groupMatches, knockoutMatches) {
  const ids = [
    ...(groupMatches ?? [])
      .filter((m) => m.status === 'finished')
      .map((m) => `g:${resultKey(m)}`),
    ...(knockoutMatches ?? [])
      .filter((m) => m.status === 'finished')
      .map((m) => `k:${resultKey(m)}`),
  ].sort();
  return ids.join(',');
}

function parseResultsSig(sig) {
  return (sig ?? '').split(',').filter(Boolean);
}

/** True when an already-finished match score changed (not when a new match is added). */
export function finishedResultsCorrected(prevSig, nextSig) {
  if (!prevSig || !nextSig || prevSig === nextSig) return false;
  const nextParts = parseResultsSig(nextSig);
  for (const part of parseResultsSig(prevSig)) {
    const id = part.split(':')[0];
    const nextPart = nextParts.find((candidate) => candidate.startsWith(`${id}:`));
    if (nextPart && nextPart !== part) return true;
  }
  return false;
}

/** Finished-match results for movement snapshots (group stage list). */
export function finishedMatchResultsSignature(matches) {
  return (matches ?? [])
    .filter((m) => m.status === 'finished')
    .map((m) => resultKey(m))
    .sort()
    .join(',');
}

export function sortLeaderboardEntries(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return (a.name ?? '').localeCompare(b.name ?? '', 'sv');
  });
}

/** List position in the sorted table (1…n). Used for “platser” movement. */
export function ordinalRanksFromEntries(entries) {
  const sorted = sortLeaderboardEntries(entries);
  const ranks = {};
  for (let i = 0; i < sorted.length; i += 1) {
    ranks[sorted[i].userId] = i + 1;
  }
  return ranks;
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

export function loadRankSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.matchId || !parsed?.ranks) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRankSnapshot(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private mode */
  }
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
 * Movement since the previous finished match. Positive = moved up in the list.
 * Persists across visits until another match finishes.
 */
export function resolveRankMovements(entries, latestMatchId, resultsSignature = null) {
  const currentRanks = ordinalRanksFromEntries(entries);
  const snapshot = loadRankSnapshot();

  if (!latestMatchId) {
    return {};
  }

  if (
    resultsSignature &&
    snapshot?.resultsSig &&
    finishedResultsCorrected(snapshot.resultsSig, resultsSignature)
  ) {
    saveRankSnapshot({
      matchId: latestMatchId,
      ranks: currentRanks,
      priorMatchId: null,
      priorRanks: null,
      resultsSig: resultsSignature,
    });
    return {};
  }

  if (!snapshot) {
    saveRankSnapshot({
      matchId: latestMatchId,
      ranks: currentRanks,
      priorMatchId: null,
      priorRanks: null,
      resultsSig: resultsSignature,
    });
    return {};
  }

  if (snapshot.matchId === latestMatchId) {
    const movements = movementsBetween(snapshot.priorRanks, currentRanks);
    if (JSON.stringify(snapshot.ranks) !== JSON.stringify(currentRanks)) {
      saveRankSnapshot({
        ...snapshot,
        ranks: currentRanks,
        resultsSig: resultsSignature ?? snapshot.resultsSig,
      });
    }
    return movements;
  }

  const movements = movementsBetween(snapshot.ranks, currentRanks);
  saveRankSnapshot({
    matchId: latestMatchId,
    ranks: currentRanks,
    priorMatchId: snapshot.matchId,
    priorRanks: snapshot.ranks,
    resultsSig: resultsSignature ?? snapshot.resultsSig,
  });
  return movements;
}
