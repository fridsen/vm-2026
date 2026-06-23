import { describe, expect, it } from 'vitest';
import { nextLeaderboardSort, sortLeaderboardEntries } from './leaderboardSort.js';

describe('leaderboardSort', () => {
  const entries = [
    { userId: 'a', name: 'Anna', points: 100 },
    { userId: 'b', name: 'Bertil', points: 80 },
    { userId: 'c', name: 'Cecilia', points: 80 },
  ];

  it('sorts by total points descending by default', () => {
    const sorted = sortLeaderboardEntries(entries, { key: 'total', dir: 'desc' });
    expect(sorted.map((e) => e.userId)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by latest match points', () => {
    const sorted = sortLeaderboardEntries(
      entries,
      { key: 'latest', dir: 'desc' },
      { a: 2, b: 6, c: 0 },
    );
    expect(sorted.map((e) => e.userId)).toEqual(['b', 'a', 'c']);
  });

  it('toggles direction when clicking the same column', () => {
    expect(nextLeaderboardSort({ key: 'total', dir: 'desc' }, 'total')).toEqual({
      key: 'total',
      dir: 'asc',
    });
    expect(nextLeaderboardSort({ key: 'latest', dir: 'asc' }, 'latest')).toEqual({
      key: 'latest',
      dir: 'desc',
    });
    expect(nextLeaderboardSort({ key: 'total', dir: 'desc' }, 'latest')).toEqual({
      key: 'latest',
      dir: 'desc',
    });
  });
});
