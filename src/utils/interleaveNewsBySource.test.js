import { describe, expect, it } from 'vitest';
import { interleaveNewsBySource } from './interleaveNewsBySource.js';

describe('interleaveNewsBySource', () => {
  it('mixes sources instead of grouping one publisher first', () => {
    const articles = [
      { id: '1', source: 'Fotbollskanalen', publishedAt: '2026-06-05T20:00:00.000Z' },
      { id: '2', source: 'Fotbollskanalen', publishedAt: '2026-06-05T19:00:00.000Z' },
      { id: '3', source: 'SVT Sport', publishedAt: '2026-06-05T18:00:00.000Z' },
      { id: '4', source: 'Aftonbladet', publishedAt: '2026-06-05T17:00:00.000Z' },
    ];

    const mixed = interleaveNewsBySource(articles);

    expect(mixed[0].source).toBe('Aftonbladet');
    expect(mixed[1].source).toBe('Fotbollskanalen');
    expect(mixed[2].source).toBe('SVT Sport');
  });
});
