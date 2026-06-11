import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const {
  latestFinishedMatchId,
  loadRankSnapshot,
  ranksFromEntries,
  resolveRankMovements,
} = await import('./leaderboardMovement.js');

describe('leaderboardMovement', () => {
  const entries = [
    { userId: 'a', name: 'Anna', points: 10 },
    { userId: 'b', name: 'Bertil', points: 8 },
    { userId: 'c', name: 'Cecilia', points: 8 },
  ];

  it('picks the most recent finished match', () => {
    const id = latestFinishedMatchId([
      { id: 'm1', kickoff: '2026-06-11T12:00:00Z', status: 'finished' },
      { id: 'm2', kickoff: '2026-06-12T12:00:00Z', status: 'finished' },
      { id: 'm3', kickoff: '2026-06-13T12:00:00Z', status: 'scheduled' },
    ]);
    expect(id).toBe('m2');
  });

  it('returns no movement on first anchor', () => {
    const moves = resolveRankMovements(entries, 'm1');
    expect(moves).toEqual({});
    expect(loadRankSnapshot()).toEqual({
      matchId: 'm1',
      ranks: { a: 1, b: 2, c: 2 },
      priorMatchId: null,
      priorRanks: null,
    });
  });

  it('shows movement when a new match finishes and keeps it on revisit', () => {
    resolveRankMovements(entries, 'm1');
    const reshuffled = [
      { userId: 'c', name: 'Cecilia', points: 12 },
      { userId: 'a', name: 'Anna', points: 10 },
      { userId: 'b', name: 'Bertil', points: 8 },
    ];
    const moves = resolveRankMovements(reshuffled, 'm2');
    expect(moves).toEqual({ c: 1, a: -1, b: -1 });

    const again = resolveRankMovements(reshuffled, 'm2');
    expect(again).toEqual({ c: 1, a: -1, b: -1 });
  });

  it('assigns the same competition rank to tied players', () => {
    expect(ranksFromEntries(entries)).toEqual({ a: 1, b: 2, c: 2 });
    expect(
      ranksFromEntries([
        { userId: 'a', name: 'Anna', points: 6 },
        { userId: 'b', name: 'Bertil', points: 6 },
        { userId: 'c', name: 'Cecilia', points: 6 },
        { userId: 'd', name: 'David', points: 4 },
      ]),
    ).toEqual({ a: 1, b: 1, c: 1, d: 4 });
  });

  it('sorts tied players alphabetically in sv locale', () => {
    expect(
      ranksFromEntries([
        { userId: 'b', name: 'Bertil', points: 8 },
        { userId: 'c', name: 'Cecilia', points: 8 },
      ]),
    ).toEqual({ b: 1, c: 1 });
  });
});
