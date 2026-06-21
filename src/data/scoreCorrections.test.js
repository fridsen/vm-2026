import { describe, expect, it } from 'vitest';
import { correctedMatchResult } from './scoreCorrections.js';

describe('correctedMatchResult', () => {
  it('corrects Spain vs Saudi Arabia provider errata', () => {
    expect(correctedMatchResult('H-R2-M1', { home: 5, away: 0 })).toEqual({
      home: 4,
      away: 0,
    });
  });

  it('passes through other matches unchanged', () => {
    const result = { home: 2, away: 1 };
    expect(correctedMatchResult('H-R1-M1', result)).toBe(result);
  });
});
