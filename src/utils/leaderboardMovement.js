const STORAGE_KEY = 'vm2026:leaderboardRankSnapshot:v1';

/** Latest finished group match id (kickoff order), or null. */
export function latestFinishedMatchId(matches) {
  const finished = (matches ?? [])
    .filter((m) => m.status === 'finished' || m.result != null)
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  return finished[0]?.id ?? null;
}

export function ranksFromEntries(entries) {
  const sorted = [...(entries ?? [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return (a.name ?? '').localeCompare(b.name ?? '', 'sv');
  });
  const ranks = {};
  for (let i = 0; i < sorted.length; i += 1) {
    ranks[sorted[i].userId] = i + 1;
  }
  return ranks;
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
 * Movement since the previous finished match. Positive = moved up.
 * Persists across visits until another match finishes.
 */
export function resolveRankMovements(entries, latestMatchId) {
  const currentRanks = ranksFromEntries(entries);
  const snapshot = loadRankSnapshot();

  if (!latestMatchId) {
    return {};
  }

  if (!snapshot) {
    saveRankSnapshot({
      matchId: latestMatchId,
      ranks: currentRanks,
      priorMatchId: null,
      priorRanks: null,
    });
    return {};
  }

  if (snapshot.matchId === latestMatchId) {
    const movements = movementsBetween(snapshot.priorRanks, currentRanks);
    if (JSON.stringify(snapshot.ranks) !== JSON.stringify(currentRanks)) {
      saveRankSnapshot({ ...snapshot, ranks: currentRanks });
    }
    return movements;
  }

  const movements = movementsBetween(snapshot.ranks, currentRanks);
  saveRankSnapshot({
    matchId: latestMatchId,
    ranks: currentRanks,
    priorMatchId: snapshot.matchId,
    priorRanks: snapshot.ranks,
  });
  return movements;
}
