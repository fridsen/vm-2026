import { describe, expect, it } from 'vitest';
import { formatMatchPointsLabel, matchPointsBadgeColors } from './matchPointsBadge.js';

describe('matchPointsBadge', () => {
  it('maps each earned tier to design colors', () => {
    expect(matchPointsBadgeColors(0)).toEqual({ bg: '#F1EFE8', text: '#5F5E5A' });
    expect(matchPointsBadgeColors(3)).toEqual({ bg: '#EAF3DE', text: '#3B6D11' });
    expect(matchPointsBadgeColors(6)).toEqual({ bg: '#E1F5EE', text: '#0F6E56' });
  });

  it('uses the 4-pt palette for 5 points', () => {
    expect(matchPointsBadgeColors(5)).toEqual(matchPointsBadgeColors(4));
  });

  it('formats pt labels', () => {
    expect(formatMatchPointsLabel(1)).toBe('1 pt');
    expect(formatMatchPointsLabel(4)).toBe('4 pts');
  });
});
