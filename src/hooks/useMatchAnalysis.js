import { useMemo } from 'react';
import { mockProbabilities, buildAnalysis } from '../utils/aiAnalysis.js';
import { getMatchAnalysis } from '../data/matchAnalysis.js';

/**
 * Analysis blurb for the prediction sheet.
 * Curated copy from `matchAnalysis.js`, else deterministic templated text.
 */
export function useMatchAnalysis(homeTeam, awayTeam) {
  return useMemo(() => {
    if (!homeTeam || !awayTeam) return { blurb: '' };

    const staticBlurb = getMatchAnalysis(homeTeam.code, awayTeam.code);
    if (staticBlurb) return { blurb: staticBlurb };

    const probs = mockProbabilities(homeTeam, awayTeam);
    return { blurb: buildAnalysis(homeTeam, awayTeam, probs) };
  }, [homeTeam, awayTeam]);
}
