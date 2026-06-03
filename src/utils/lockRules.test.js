import { describe, expect, it } from 'vitest';
import {
  formatCountdown,
  getGlobalDeadline,
  isTournamentLocked,
  msUntil,
} from './lockRules.js';

const groupMatches = [
  { id: 'late', round: 1, kickoff: '2026-06-12T04:00:00+02:00' },
  { id: 'first', round: 1, kickoff: '2026-06-11T21:00:00+02:00' },
];

describe('tournament lock', () => {
  it('uses the first group kickoff as the global deadline', () => {
    expect(getGlobalDeadline(groupMatches)).toBe('2026-06-11T21:00:00+02:00');
  });

  it('locks at kickoff and remains open before kickoff', () => {
    expect(isTournamentLocked('2026-06-11T20:59:59+02:00', groupMatches)).toBe(false);
    expect(isTournamentLocked('2026-06-11T21:00:00+02:00', groupMatches)).toBe(true);
  });
});

describe('deadline formatting', () => {
  it('returns milliseconds until a deadline', () => {
    expect(msUntil('2026-06-11T21:00:00+02:00', '2026-06-11T20:59:00+02:00')).toBe(60_000);
  });

  it('formats passed deadlines as locked', () => {
    expect(formatCountdown(0)).toBe('Låst');
    expect(formatCountdown(-1)).toBe('Låst');
  });
});
