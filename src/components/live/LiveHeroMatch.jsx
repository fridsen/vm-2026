import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HERO_VARIANT, selectHeroMatches } from '../../utils/selectHeroMatch.js';
import { scoreGroupMatch } from '../../utils/scoring.js';
import MatchHeroCard from '../matches/MatchHeroCard.jsx';

export default function LiveHeroMatch({ matches, now, predictions }) {
  const selection = useMemo(() => selectHeroMatches(matches, now), [matches, now]);
  const matchPreds = predictions?.matches ?? {};

  if (!selection?.matches.length) {
    return null;
  }

  const { matches: heroMatches, variant } = selection;
  const label = heroMatches.length > 1 ? 'Aktuella matcher' : 'Aktuell match';

  return (
    <div className="live-hero-match-stack" aria-label={label}>
      {heroMatches.map((match) => {
        const prediction = matchPreds[match.id];
        const pointsEarned =
          variant === HERO_VARIANT.RECENT_FINISHED && match.result
            ? scoreGroupMatch(prediction, match.result).points
            : undefined;

        return (
          <section key={match.id} className="live-hero-match">
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
      })}
    </div>
  );
}
