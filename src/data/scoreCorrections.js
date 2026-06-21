// football-data.org FT errata until the provider corrects their feed.
// Keys are internal match ids (e.g. H-R2-M1).

const CORRECTIONS = {
  'H-R2-M1': { home: 4, away: 0 },
};

export function correctedMatchResult(matchId, result) {
  if (!result) return result;
  const fix = CORRECTIONS[matchId];
  if (!fix) return result;
  if (result.home === fix.home && result.away === fix.away) return result;
  return { ...fix };
}
