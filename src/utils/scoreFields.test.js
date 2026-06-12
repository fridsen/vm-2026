import { describe, expect, it } from 'vitest';
import { scoreFieldsForFullSync } from '../../supabase/functions/_shared/scoreFields.ts';

describe('scoreFieldsForFullSync', () => {
  const existing = {
    external_id: '1',
    home_score: 2,
    away_score: 1,
    status: 'in_play',
  };

  it('writes finished when provider sends scores', () => {
    expect(
      scoreFieldsForFullSync(
        {
          externalId: '1',
          stage: 'group',
          kickoff: '',
          homeScore: 2,
          awayScore: 1,
          status: 'finished',
        },
        existing,
      ),
    ).toEqual({ home_score: 2, away_score: 1, status: 'finished' });
  });

  it('preserves in_play when provider still shows scheduled without scores', () => {
    expect(
      scoreFieldsForFullSync(
        {
          externalId: '1',
          stage: 'group',
          kickoff: '',
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
        },
        existing,
      ),
    ).toEqual({ home_score: 2, away_score: 1, status: 'in_play' });
  });

  it('does not mark finished without scores from provider', () => {
    expect(
      scoreFieldsForFullSync(
        {
          externalId: '1',
          stage: 'group',
          kickoff: '',
          homeScore: null,
          awayScore: null,
          status: 'finished',
        },
        { ...existing, status: 'scheduled', home_score: null, away_score: null },
      ),
    ).toEqual({ home_score: null, away_score: null, status: 'scheduled' });
  });

  it('keeps existing finished scores when provider is finished without scores', () => {
    expect(
      scoreFieldsForFullSync(
        {
          externalId: '1',
          stage: 'group',
          kickoff: '',
          homeScore: null,
          awayScore: null,
          status: 'finished',
        },
        { ...existing, status: 'finished' },
      ),
    ).toEqual({ home_score: 2, away_score: 1, status: 'finished' });
  });
});
