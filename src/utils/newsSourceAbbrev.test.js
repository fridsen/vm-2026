import { describe, expect, it } from 'vitest';
import { abbreviateNewsSource } from './newsSourceAbbrev.js';

describe('abbreviateNewsSource', () => {
  it('maps known Swedish sports sources', () => {
    expect(abbreviateNewsSource('Aftonbladet')).toBe('AB');
    expect(abbreviateNewsSource('Expressen')).toBe('EXP');
    expect(abbreviateNewsSource('Fotbollskanalen')).toBe('FBK');
    expect(abbreviateNewsSource('SVT')).toBe('SVT');
  });

  it('falls back to a three-letter abbreviation', () => {
    expect(abbreviateNewsSource('Some Other Outlet')).toBe('SOM');
  });
});
