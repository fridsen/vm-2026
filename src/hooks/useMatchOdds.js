import { useEffect, useState } from 'react';
import {
  fetchWorldCupOdds,
  findOddsForMatch,
  isLiveOddsEnabled,
} from '../services/oddsApi.js';
import { fetchLlmAnalysis, isLlmEnabled } from '../services/llmAnalysis.js';
import { mockProbabilities, pickFromProbs, buildAnalysis } from '../utils/aiAnalysis.js';

/**
 * `useMatchOdds(homeTeam, awayTeam, context)` — returns 1X2 probabilities and
 * an analysis blurb for a matchup, with progressive enhancement:
 *
 * 1. Renders the templated mock instantly (no flash of empty card).
 * 2. If `VITE_ODDS_API_KEY` is set, replaces probabilities with live
 *    bookmaker-implied probs (margin removed) — `source: 'live'`.
 * 3. If `VITE_OPENAI_API_KEY` is set, replaces the templated blurb with
 *    a real LLM-generated Swedish analysis — `analysisSource: 'llm'`.
 *
 * `analysisLoading` indicates the LLM call is in flight; the existing
 * templated `blurb` is what gets displayed in the meantime.
 */
export function useMatchOdds(homeTeam, awayTeam, context = {}) {
  const [state, setState] = useState({
    loading: false,
    probs: null,
    pick: null,
    blurb: '',
    source: 'mock',
    bookmaker: null,
    analysisSource: 'templated',
    analysisLoading: false,
    error: null,
  });

  const homeId = homeTeam?.id;
  const awayId = awayTeam?.id;
  // Stringify context so we don't restart the effect on object identity changes.
  const ctxKey = `${context.group ?? ''}|${context.round ?? ''}`;

  useEffect(() => {
    if (!homeTeam || !awayTeam) return;

    // 1. Seed with templated mock — UI never renders empty.
    const mockProbs = mockProbabilities(homeTeam, awayTeam);
    const mockPick = pickFromProbs(mockProbs);
    const mockBlurb = buildAnalysis(homeTeam, awayTeam, mockProbs);

    let probs = mockProbs;
    let pick = mockPick;
    let source = 'mock';
    let bookmaker = null;

    setState({
      loading: isLiveOddsEnabled(),
      probs,
      pick,
      blurb: mockBlurb,
      source,
      bookmaker,
      analysisSource: 'templated',
      analysisLoading: isLlmEnabled(),
      error: null,
    });

    let cancelled = false;
    const controller = new AbortController();

    // 2. Live odds → upgrade probs.
    const oddsPromise = isLiveOddsEnabled()
      ? fetchWorldCupOdds().then((events) => {
          if (cancelled) return;
          const live = findOddsForMatch(events, homeTeam, awayTeam);
          if (live) {
            probs = live.probs;
            pick = pickFromProbs(probs);
            source = 'live';
            bookmaker = live.bookmaker;
            setState((s) => ({
              ...s,
              probs,
              pick,
              blurb: buildAnalysis(homeTeam, awayTeam, probs),
              source,
              bookmaker,
              loading: false,
            }));
          } else {
            setState((s) => ({ ...s, loading: false }));
          }
        }).catch((err) => {
          if (cancelled) return;
          setState((s) => ({ ...s, loading: false, error: err.message }));
        })
      : Promise.resolve();

    // 3. LLM analysis — kick off after probs settle, using whichever ones we
    //    end up with (live preferred, mock fallback).
    if (isLlmEnabled()) {
      oddsPromise.then(() => {
        if (cancelled) return;
        fetchLlmAnalysis(homeTeam, awayTeam, probs, context, {
          signal: controller.signal,
        }).then((llmText) => {
          if (cancelled || !llmText) {
            // No LLM result → keep templated blurb, just clear loading.
            setState((s) => ({ ...s, analysisLoading: false }));
            return;
          }
          setState((s) => ({
            ...s,
            blurb: llmText,
            analysisSource: 'llm',
            analysisLoading: false,
          }));
        });
      });
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId, awayId, ctxKey]);

  return state;
}
