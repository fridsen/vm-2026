// Auto-beräkna 1X2-tecken från hem/borta-mål.
// 1 = hemmavinst, X = oavgjort, 2 = bortavinst.

export function signFromScore(home, away) {
  if (home == null || away == null || home === '' || away === '') return null;
  const h = Number(home);
  const a = Number(away);
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return '1';
  if (h < a) return '2';
  return 'X';
}

/** User's 1/X/2 pick — explicit outcome wins over score-derived sign (see scoring.js). */
export function predictionSign(prediction) {
  if (!prediction) return null;
  if (
    prediction.outcome === '1' ||
    prediction.outcome === 'X' ||
    prediction.outcome === '2'
  ) {
    return prediction.outcome;
  }
  return signFromScore(prediction.home, prediction.away);
}
