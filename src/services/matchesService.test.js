import { describe, expect, it } from 'vitest';

// Mirror rowToMatch mapping rules for regression coverage.
function scoresFromRow(r) {
  if (r.home_score == null || r.away_score == null) return null;
  return { home: r.home_score, away: r.away_score };
}

function rowToMatch(r) {
  const scores = scoresFromRow(r);
  const isFinished = r.status === 'finished';
  return {
    id: r.id,
    result: isFinished ? scores : null,
    liveScore: !isFinished && scores ? scores : null,
    status: r.status,
  };
}

describe('matchesService row mapping', () => {
  it('exposes live scores while in_play', () => {
    const live = rowToMatch({
      id: 'm1',
      status: 'in_play',
      home_score: 1,
      away_score: 0,
    });
    expect(live.liveScore).toEqual({ home: 1, away: 0 });
    expect(live.result).toBeNull();
  });

  it('exposes live scores when provider lags on status but scores are present', () => {
    const lagging = rowToMatch({
      id: 'm1',
      status: 'scheduled',
      home_score: 0,
      away_score: 1,
    });
    expect(lagging.liveScore).toEqual({ home: 0, away: 1 });
    expect(lagging.result).toBeNull();
  });

  it('exposes result only when finished with both scores', () => {
    const ft = rowToMatch({
      id: 'm1',
      status: 'finished',
      home_score: 2,
      away_score: 1,
    });
    expect(ft.result).toEqual({ home: 2, away: 1 });
    expect(ft.liveScore).toBeNull();
  });

  it('does not expose result when finished but scores are missing', () => {
    const broken = rowToMatch({
      id: 'm1',
      status: 'finished',
      home_score: null,
      away_score: null,
    });
    expect(broken.result).toBeNull();
    expect(broken.liveScore).toBeNull();
  });
});
