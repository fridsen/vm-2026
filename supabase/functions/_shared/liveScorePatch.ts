export type ExistingScoreRow = {
  home_score: number | null;
  away_score: number | null;
  status: string;
};

export type IncomingFixtureScores = {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

/** Build score/status fields for a live sync update, or null when unchanged. */
export function buildLiveScorePatch(
  existing: ExistingScoreRow | null,
  incoming: IncomingFixtureScores,
): {
  home_score?: number;
  away_score?: number;
  status?: string;
} | null {
  const patch: {
    home_score?: number;
    away_score?: number;
    status?: string;
  } = {};

  const hasIncomingScores =
    incoming.homeScore != null && incoming.awayScore != null;
  const hasExistingScores =
    existing?.home_score != null && existing?.away_score != null;

  if (hasIncomingScores) {
    const newTotal = incoming.homeScore! + incoming.awayScore!;
    const existingTotal =
      (existing?.home_score ?? 0) + (existing?.away_score ?? 0);
    const wouldDowngrade =
      existing?.status === 'in_play' && newTotal < existingTotal;
    const scoresDiffer =
      existing?.home_score !== incoming.homeScore ||
      existing?.away_score !== incoming.awayScore;

    if (!wouldDowngrade && scoresDiffer) {
      patch.home_score = incoming.homeScore!;
      patch.away_score = incoming.awayScore!;
    }
  }

  if (incoming.status === 'finished' && (hasIncomingScores || hasExistingScores)) {
    if (existing?.status !== 'finished') patch.status = 'finished';
  } else if (
    existing?.status !== 'finished' &&
    incoming.status === 'in_play' &&
    (hasIncomingScores || hasExistingScores)
  ) {
    if (existing?.status !== 'in_play') patch.status = 'in_play';
  } else if (
    existing?.status !== 'finished' &&
    existing?.status !== 'in_play' &&
    (hasIncomingScores || hasExistingScores)
  ) {
    // football-data often returns TIMED/scheduled with scores during live play.
    patch.status = 'in_play';
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
