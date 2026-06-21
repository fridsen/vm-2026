import { describe, expect, it } from 'vitest';
import { revealVerdict } from './revealVerdict.js';

describe('revealVerdict', () => {
  it('returns exact match verdict', () => {
    expect(revealVerdict({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe('Exakt rätt!');
  });

  it('returns correct sign verdict', () => {
    expect(revealVerdict({ home: 3, away: 0 }, { home: 2, away: 1 })).toBe('Rätt tecken');
  });

  it('returns wrong sign verdict', () => {
    expect(revealVerdict({ home: 0, away: 2 }, { home: 2, away: 1 })).toBe('Fel tecken');
  });
});
