import { useMemo } from 'react';
import clsx from 'clsx';
import { scoreGroupMatch } from '../utils/scoring.js';
import { MATCH_STATE, getMatchState } from '../utils/matchSchedule.js';
import MatchHeroCard from './matches/MatchHeroCard.jsx';

export default function MatchCard({
  match,
  prediction,
  onPredict,
  now = Date.now(),
  revealPending = false,
  onReveal,
  onSkip,
}) {
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

  const interactive = Boolean(onPredict) && !revealPending;
  const Wrapper = interactive ? 'button' : 'div';

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      className={clsx('match-card', prediction && 'has-prediction')}
      onClick={interactive ? onPredict : undefined}
      disabled={interactive ? false : undefined}
    >
      <MatchHeroCard
        match={match}
        now={now}
        variant={variant}
        prediction={prediction}
        pointsEarned={pointsEarned}
        revealPending={revealPending}
        onReveal={onReveal}
        onSkip={onSkip}
      />
    </Wrapper>
  );
}
