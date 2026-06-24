import { describe, expect, it } from 'vitest';
import {
  formatMatchPointsLabel,
  formatMatchPointsPartsLabel,
  matchPointsBadgeColors,
} from './matchPointsBadge.js';

describe('matchPointsBadge', () => {
  it('maps each earned tier to design colors', () => {
    expect(matchPointsBadgeColors(0)).toEqual({ bg: '#F1EFE8', text: '#5F5E5A' });
    expect(matchPointsBadgeColors(3)).toEqual({ bg: '#E6F1FB', text: '#185FA5' });
    expect(matchPointsBadgeColors(6)).toEqual({ bg: '#EAF3DE', text: '#3B6D11' });
  });

  it('uses the 4-pt palette for 5 points', () => {
    expect(matchPointsBadgeColors(5)).toEqual(matchPointsBadgeColors(4));
  });

  it('uses the 6-pt palette for combined totals above 6', () => {
    expect(matchPointsBadgeColors(10)).toEqual(matchPointsBadgeColors(6));
  });

  it('formats pt labels', () => {
    expect(formatMatchPointsLabel(1)).toBe('1 pt');
    expect(formatMatchPointsLabel(4)).toBe('4 pts');
  });

  it('formats same-kickoff parts as X + X pts', () => {
    expect(formatMatchPointsPartsLabel([4, 2])).toBe('4 + 2 pts');
    expect(formatMatchPointsPartsLabel([1])).toBe('1 pt');
  });
});
