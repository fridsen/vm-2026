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
  finishedMatchesSignature,
  finishedMatchResultsSignature,
  latestFinishedMatchId,
  loadRankSnapshot,
  ordinalRanksFromEntries,
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

  it('builds a signature across group and knockout finishes', () => {
    const before = finishedMatchesSignature(
      [{ id: 'm1', status: 'finished', result: { home: 1, away: 0 } }],
      [],
    );
    const after = finishedMatchesSignature(
      [{ id: 'm1', status: 'finished', result: { home: 1, away: 0 } }],
      [{ id: 'qf1', status: 'finished', result: { home: 2, away: 1 } }],
    );
    expect(before).not.toBe(after);
  });

  it('changes signature when a finished score is corrected', () => {
    const before = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 5, away: 0 } },
    ]);
    const after = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 4, away: 0 } },
    ]);
    expect(before).not.toBe(after);
  });

  it('returns no movement on first anchor', () => {
    const resultsSig = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 1, away: 0 } },
    ]);
    const moves = resolveRankMovements(entries, 'm1', resultsSig);
    expect(moves).toEqual({});
    expect(loadRankSnapshot()).toEqual({
      matchId: 'm1',
      ranks: { a: 1, b: 2, c: 3 },
      priorMatchId: null,
      priorRanks: null,
      resultsSig,
    });
  });

  it('shows list-position movement when a new match finishes and keeps it on revisit', () => {
    const resultsSigM1 = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 1, away: 0 } },
    ]);
    resolveRankMovements(entries, 'm1', resultsSigM1);
    const reshuffled = [
      { userId: 'c', name: 'Cecilia', points: 12 },
      { userId: 'a', name: 'Anna', points: 10 },
      { userId: 'b', name: 'Bertil', points: 8 },
    ];
    const resultsSigM2 = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 1, away: 0 } },
      { id: 'm2', status: 'finished', result: { home: 0, away: 0 } },
    ]);
    const moves = resolveRankMovements(reshuffled, 'm2', resultsSigM2);
    expect(moves).toEqual({ c: 2, a: -1, b: -1 });

    const again = resolveRankMovements(reshuffled, 'm2', resultsSigM2);
    expect(again).toEqual({ c: 2, a: -1, b: -1 });
  });

  it('does not count tied competition ranks as zero list movement', () => {
    const tied = [
      { userId: 'a', name: 'Anna', points: 6 },
      { userId: 'b', name: 'Bertil', points: 6 },
      { userId: 'c', name: 'Cecilia', points: 4 },
    ];
    expect(ordinalRanksFromEntries(tied)).toEqual({ a: 1, b: 2, c: 3 });
    expect(ranksFromEntries(tied)).toEqual({ a: 1, b: 1, c: 3 });
  });

  it('resets movement when a finished result is corrected', () => {
    const sigWrong = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 5, away: 0 } },
    ]);
    resolveRankMovements(entries, 'm1', sigWrong);
    const sigCorrect = finishedMatchResultsSignature([
      { id: 'm1', status: 'finished', result: { home: 4, away: 0 } },
    ]);
    const reshuffled = [
      { userId: 'c', name: 'Cecilia', points: 12 },
      { userId: 'a', name: 'Anna', points: 10 },
      { userId: 'b', name: 'Bertil', points: 8 },
    ];
    resolveRankMovements(reshuffled, 'm1', sigCorrect);
    const moves = resolveRankMovements(reshuffled, 'm1', sigCorrect);
    expect(moves).toEqual({});
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
