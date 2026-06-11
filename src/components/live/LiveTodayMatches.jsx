import { useMemo } from 'react';
import { selectCarouselMatches } from '../../utils/liveTodayMatches.js';
import LiveMatchCarouselCard from './LiveMatchCarouselCard.jsx';

export default function LiveTodayMatches({ matches, now }) {
  const { matches: carouselMatches, isToday } = useMemo(
    () => selectCarouselMatches(matches, now),
    [matches, now],
  );

  const single = carouselMatches.length === 1;

  if (carouselMatches.length === 0) {
    return (
      <section className="live-matches">
        <p className="live-matches-empty">Inga matcher att visa.</p>
      </section>
    );
  }

  return (
    <section className="live-matches" aria-label={isToday ? 'Dagens matcher' : 'Närmaste matcher'}>
      <div className={single ? 'live-matches-single' : 'live-matches-scroll'}>
        {carouselMatches.map((match) => (
          <LiveMatchCarouselCard key={match.id} match={match} now={now} single={single} />
        ))}
      </div>
    </section>
  );
}
