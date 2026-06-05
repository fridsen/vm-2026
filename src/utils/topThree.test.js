import { describe, expect, it } from 'vitest';
import { scoreTopThree } from './scoring.js';
import {
  countTopThreeFilled,
  normalizeTopThree,
  toggleTopThree,
} from './topThree.js';

describe('normalizeTopThree', () => {
  it('migrates legacy single winner string', () => {
    expect(normalizeTopThree('BRA')).toEqual(['BRA', null, null]);
  });

  it('keeps three slots', () => {
    expect(normalizeTopThree(['A', 'B', 'C'])).toEqual(['A', 'B', 'C']);
  });
});

describe('toggleTopThree', () => {
  it('fills slots in order then clears on re-tap', () => {
    let slots = [null, null, null];
    slots = toggleTopThree(slots, 'A');
    slots = toggleTopThree(slots, 'B');
    expect(slots).toEqual(['A', 'B', null]);
    slots = toggleTopThree(slots, 'A');
    expect(slots).toEqual([null, 'B', null]);
  });
});

describe('scoreTopThree', () => {
  it('awards 15/10/5 for exact podium order', () => {
    const result = scoreTopThree(['A', 'B', 'C'], ['A', 'B', 'C']);
    expect(result.points).toBe(30);
    expect(result.breakdown).toEqual({ first: 15, second: 10, third: 5 });
  });

  it('awards partial credit only for correct positions', () => {
    expect(scoreTopThree(['A', 'B', 'C'], ['B', 'A', 'C']).points).toBe(5);
  });
});

describe('countTopThreeFilled', () => {
  it('counts non-empty slots', () => {
    expect(countTopThreeFilled(['A', null, 'C'])).toBe(2);
  });
});
