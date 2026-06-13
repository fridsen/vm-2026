import { describe, expect, it } from 'vitest';
import { buildMatchDays } from './matchDays.js';

describe('buildMatchDays', () => {
  it('groups and sorts matches by day and kickoff', () => {
    const matches = [
      { id: 'b', kickoff: '2026-06-16T21:00:00Z' },
      { id: 'a', kickoff: '2026-06-15T18:00:00Z' },
      { id: 'c', kickoff: '2026-06-15T21:00:00Z' },
    ];
    const days = buildMatchDays(matches);
    expect(days.map((d) => d.dayKey)).toEqual(['2026-06-15', '2026-06-16']);
    expect(days[0].matches.map((m) => m.id)).toEqual(['a', 'c']);
    expect(days[1].matches.map((m) => m.id)).toEqual(['b']);
  });
});
