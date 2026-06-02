import { useEffect, useState } from 'react';
import {
  fetchWorldCupOdds,
  findOddsForMatch,
  isLiveOddsEnabled,
} from '../services/oddsApi.js';
import { mockProbabilities, pickFromProbs, buildAnalysis } from '../utils/aiAnalysis.js';
import { getMatchAnalysis } from '../data/matchAnalysis.js';

/**
 * `useMatchOdds(homeTeam, awayTeam, context)` — returns 1X2 probabilities and
 * an analysis blurb for a matchup.
 *
 * Analysis: a hardcoded, curated Swedish text (from `data/matchAnalysis.js`),
 * matched by the two team codes. If the matchup isn't listed (e.g. knockout
 * ties), it falls back to the deterministic templated `buildAnalysis`.
 *
 * Probabilities: rendered instantly from the templated mock, then upgraded to
 * live bookmaker-implied probs (margin removed) if `VITE_ODDS_API_KEY` is set
 * — `source: 'live'`. The curated analysis text never changes with the odds;
 * only the templated fallback tracks them.
 */
// Synchronous seed: probabilities + analysis blurb are deterministic, so we
// can compute them during render. This keeps the analysis card present on the
// very first paint (no async pop-in), which matters for height measurement in
// the prediction-sheet carousel. Only the live-odds upgrade is async.
function seedState(homeTeam, awayTeam) {
  if (!homeTeam || !awayTeam) {
    return {
      loading: false,
      probs: null,
      pick: null,
      blurb: '',
      source: 'mock',
      bookmaker: null,
      analysisSource: 'static',
      analysisLoading: false,
      error: null,
    };
  }
  const staticBlurb = getMatchAnalysis(homeTeam.code, awayTeam.code);
  const mockProbs = mockProbabilities(homeTeam, awayTeam);
  return {
    loading: isLiveOddsEnabled(),
    probs: mockProbs,
    pick: pickFromProbs(mockProbs),
    blurb: staticBlurb || buildAnalysis(homeTeam, awayTeam, mockProbs),
    source: 'mock',
    bookmaker: null,
    analysisSource: staticBlurb ? 'static' : 'templated',
    analysisLoading: false,
    error: null,
  };
}

export function useMatchOdds(homeTeam, awayTeam, context = {}) {
  const [state, setState] = useState(() => seedState(homeTeam, awayTeam));

  const homeId = homeTeam?.id;
  const awayId = awayTeam?.id;
  // Stringify context so we don't restart the effect on object identity changes.
  const ctxKey = `${context.group ?? ''}|${context.round ?? ''}`;

  useEffect(() => {
    if (!homeTeam || !awayTeam) return;

    // Curated analysis keyed by the matchup (order-independent). Falls back to
    // the templated text when a matchup isn't in the hardcoded set.
    const staticBlurb = getMatchAnalysis(homeTeam.code, awayTeam.code);

    // Re-seed when the matchup changes (probs/blurb computed synchronously).
    const mockProbs = mockProbabilities(homeTeam, awayTeam);
    let probs = mockProbs;
    let pick = pickFromProbs(mockProbs);
    setState(seedState(homeTeam, awayTeam));

    let cancelled = false;

    // Live odds → upgrade probs (and the templated fallback only).
    if (isLiveOddsEnabled()) {
      fetchWorldCupOdds()
        .then((events) => {
          if (cancelled) return;
          const live = findOddsForMatch(events, homeTeam, awayTeam);
          if (live) {
            probs = live.probs;
            pick = pickFromProbs(probs);
            setState((s) => ({
              ...s,
              probs,
              pick,
              // Hardcoded analysis always wins; the templated fallback tracks odds.
              blurb: staticBlurb || buildAnalysis(homeTeam, awayTeam, probs),
              source: 'live',
              bookmaker: live.bookmaker,
              loading: false,
            }));
          } else {
            setState((s) => ({ ...s, loading: false }));
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setState((s) => ({ ...s, loading: false, error: err.message }));
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId, awayId, ctxKey]);

  return state;
}
