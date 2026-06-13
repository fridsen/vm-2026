import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { selectHeroMatch } from '../../utils/selectHeroMatch.js';
import { scoreGroupMatch } from '../../utils/scoring.js';
import MatchHeroCard from '../matches/MatchHeroCard.jsx';

export default function LiveHeroMatch({ matches, now, predictions }) {
  const selection = useMemo(() => selectHeroMatch(matches, now), [matches, now]);
  const matchPreds = predictions?.matches ?? {};

  if (!selection) {
    return null;
  }

  const { match, variant } = selection;
  const prediction = matchPreds[match.id];
  const pointsEarned =
    variant === 'recent-finished' && match.result
      ? scoreGroupMatch(prediction, match.result).points
      : undefined;

  return (
    <section className="live-hero-match" aria-label="Aktuell match">
      <Link to="/matcher" className="live-hero-match-link">
        <MatchHeroCard
          match={match}
          now={now}
          variant={variant}
          prediction={prediction}
          pointsEarned={pointsEarned}
        />
      </Link>
    </section>
  );
}
