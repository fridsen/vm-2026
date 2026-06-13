import { useMemo } from 'react';
import { scoreGroupMatch } from '../utils/scoring.js';
import { MATCH_STATE, getMatchState } from '../utils/matchSchedule.js';
import MatchHeroCard from './matches/MatchHeroCard.jsx';

export default function MatchCard({ match, prediction, onPredict, now = Date.now() }) {
  const state = getMatchState(match, now);

  const variant = useMemo(() => {
    if (state === MATCH_STATE.LIVE) return 'live';
    if (state === MATCH_STATE.UPCOMING) return 'upcoming';
    return 'finished';
  }, [state]);

  const pointsEarned = useMemo(() => {
    if (state !== MATCH_STATE.FINISHED || !match.result) return undefined;
    return scoreGroupMatch(prediction, match.result).points;
  }, [state, match.result, prediction]);

  return (
    <button
      type="button"
      className={prediction ? 'match-card has-prediction' : 'match-card'}
      onClick={onPredict}
      disabled={!onPredict}
    >
      <MatchHeroCard
        match={match}
        now={now}
        variant={variant}
        prediction={prediction}
        pointsEarned={pointsEarned}
      />
    </button>
  );
}
