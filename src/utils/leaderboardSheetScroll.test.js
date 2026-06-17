import { describe, expect, it } from 'vitest';
import { leaderboardSheetScrollDayKey } from './leaderboardSheetScroll.js';

const days = [
  { dayKey: '2026-06-15', matches: [] },
  { dayKey: '2026-06-16', matches: [] },
  { dayKey: '2026-06-17', matches: [] },
];

describe('leaderboardSheetScrollDayKey', () => {
  it('prefers yesterday when that day exists', () => {
    const now = new Date('2026-06-17T12:00:00+02:00').getTime();
    expect(leaderboardSheetScrollDayKey(days, now)).toBe('2026-06-16');
  });

  it('falls back to the latest day before today', () => {
    const now = new Date('2026-06-16T12:00:00+02:00').getTime();
    expect(leaderboardSheetScrollDayKey(days, now)).toBe('2026-06-15');
  });

  it('uses the first day when nothing is before today', () => {
    const now = new Date('2026-06-14T12:00:00+02:00').getTime();
    expect(leaderboardSheetScrollDayKey(days, now)).toBe('2026-06-15');
  });
});
