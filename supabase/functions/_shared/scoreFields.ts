import type { ProviderFixture } from './providers/types.ts';

export type ExistingScoreRow = {
  external_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

/** football-data often returns TIMED/scheduled with null scores during live games. */
export function scoreFieldsForFullSync(
  f: ProviderFixture,
  existing?: ExistingScoreRow,
): { home_score: number | null; away_score: number | null; status: string } {
  const hasScores = f.homeScore != null && f.awayScore != null;

  if (f.status === 'finished' && hasScores) {
    return {
      home_score: f.homeScore!,
      away_score: f.awayScore!,
      status: 'finished',
    };
  }

  if (hasScores && f.status === 'in_play') {
    return {
      home_score: f.homeScore!,
      away_score: f.awayScore!,
      status: 'in_play',
    };
  }

  // Keep finished rows when football-data hasn't caught up yet.
  if (existing?.status === 'finished') {
    return {
      home_score: hasScores ? f.homeScore! : existing.home_score,
      away_score: hasScores ? f.awayScore! : existing.away_score,
      status: 'finished',
    };
  }

  // Keep in_play scores only while football-data still shows scheduled/null.
  if (existing?.status === 'in_play' && f.status === 'scheduled' && !hasScores) {
    return {
      home_score: existing.home_score,
      away_score: existing.away_score,
      status: 'in_play',
    };
  }

  // Provider marks finished before scores land — never wipe to finished+null.
  if (f.status === 'finished' && !hasScores) {
    return {
      home_score: existing?.home_score ?? null,
      away_score: existing?.away_score ?? null,
      status: existing?.status ?? 'scheduled',
    };
  }

  return {
    home_score: f.homeScore,
    away_score: f.awayScore,
    status: f.status,
  };
}
