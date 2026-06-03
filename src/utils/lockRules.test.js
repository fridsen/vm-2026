import { describe, expect, it } from 'vitest';
import {
  STATE,
  formatCountdown,
  getGlobalDeadline,
  getKnockoutRoundState,
  isGroupPhaseLocked,
  msUntil,
} from './lockRules.js';

const groupMatches = [
  { id: 'late', round: 1, kickoff: '2026-06-12T04:00:00+02:00' },
  { id: 'first', round: 1, kickoff: '2026-06-11T21:00:00+02:00' },
  { id: 'round3', round: 3, kickoff: '2026-06-24T21:00:00+02:00' },
];

describe('group phase locks', () => {
  it('uses the first group kickoff as the global deadline', () => {
    expect(getGlobalDeadline(groupMatches)).toBe('2026-06-11T21:00:00+02:00');
  });

  it('locks at kickoff and remains open before kickoff', () => {
    expect(isGroupPhaseLocked('2026-06-11T20:59:59+02:00', groupMatches)).toBe(false);
    expect(isGroupPhaseLocked('2026-06-11T21:00:00+02:00', groupMatches)).toBe(true);
  });
});

describe('knockout round locks', () => {
  const knockoutMatches = [
    { round: 'R32', kickoff: '2026-06-29T18:00:00+02:00', result: null },
    { round: 'R16', kickoff: '2026-07-04T18:00:00+02:00', result: null },
  ];

  it('opens R32 when group round 3 starts', () => {
    expect(
      getKnockoutRoundState('R32', '2026-06-24T20:59:59+02:00', groupMatches, knockoutMatches),
    ).toBe(STATE.NOT_AVAILABLE);
    expect(
      getKnockoutRoundState('R32', '2026-06-24T21:00:00+02:00', groupMatches, knockoutMatches),
    ).toBe(STATE.OPEN);
  });

  it('locks a knockout round at first kickoff', () => {
    expect(
      getKnockoutRoundState('R32', '2026-06-29T18:00:00+02:00', groupMatches, knockoutMatches),
    ).toBe(STATE.LOCKED);
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
