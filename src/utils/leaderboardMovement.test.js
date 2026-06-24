import { describe, expect, it } from 'vitest';
import {
  finishedMatchesSignature,
  latestFinishedMatchId,
  latestFinishedMatches,
  rankMovementsFromLatestMatch,
  ranksFromEntries,
} from './leaderboardMovement.js';

describe('leaderboardMovement', () => {
  const entries = [
    { userId: 'a', name: 'Anna', points: 10 },
    { userId: 'b', name: 'Bertil', points: 8 },
    { userId: 'c', name: 'Cecilia', points: 8 },
  ];

  it('picks the most recent finished match', () => {
    const id = latestFinishedMatchId([
      { id: 'm1', kickoff: '2026-06-11T12:00:00Z', status: 'finished', group: 'A' },
      { id: 'm2', kickoff: '2026-06-12T12:00:00Z', status: 'finished', group: 'A' },
      { id: 'm3', kickoff: '2026-06-13T12:00:00Z', status: 'scheduled', group: 'A' },
    ]);
    expect(id).toBe('m2');
  });

  it('returns every finished match at the latest kickoff slot', () => {
    const kickoff = '2026-06-24T19:00:00Z';
    const matches = latestFinishedMatches([
      { id: 'sui-can', kickoff, status: 'finished', group: 'B' },
      { id: 'bih-qat', kickoff, status: 'finished', group: 'A' },
      { id: 'older', kickoff: '2026-06-23T19:00:00Z', status: 'finished', group: 'A' },
    ]);
    expect(matches.map((m) => m.id)).toEqual(['bih-qat', 'sui-can']);
  });

  it('builds a signature across group and knockout finishes', () => {
    const before = finishedMatchesSignature(
      [{ id: 'm1', status: 'finished' }],
      [],
    );
    const after = finishedMatchesSignature(
      [{ id: 'm1', status: 'finished' }],
      [{ id: 'qf1', status: 'finished' }],
    );
    expect(before).not.toBe(after);
  });

  it('derives movement from totals minus latest-match points', () => {
    const current = [
      { userId: 'a', name: 'Anna', points: 104 },
      { userId: 'b', name: 'Bertil', points: 105 },
      { userId: 'c', name: 'Cecilia', points: 102 },
    ];
    const latestPoints = { a: 4, b: 6, c: 4 };
    expect(rankMovementsFromLatestMatch(current, latestPoints)).toEqual({
      b: 1,
      a: -1,
    });
  });

  it('returns no movement when latest-match points are zero for everyone', () => {
    expect(rankMovementsFromLatestMatch(entries, { a: 0, b: 0, c: 0 })).toEqual({});
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
