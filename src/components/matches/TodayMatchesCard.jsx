import { useMemo } from 'react';
import { selectTodayMatches } from '../../utils/selectTodayMatches.js';
import { useResultReveal } from '../../hooks/useResultReveal.js';
import TodayMatchRow from './TodayMatchRow.jsx';

export default function TodayMatchesCard({ matches, now, predictions }) {
  const todayMatches = useMemo(() => selectTodayMatches(matches, now), [matches, now]);
  const matchPreds = predictions?.matches ?? {};
  const { isRevealPending, openReveal, skipReveal } = useResultReveal();

  if (todayMatches.length === 0) {
    return null;
  }

  return (
    <section className="today-matches-card" aria-label="Dagens matcher">
      <header className="today-matches-header">
        <span>Dagens matcher</span>
        <span>Dina tips</span>
      </header>
      <div className="today-matches-list">
        {todayMatches.map((match) => (
          <TodayMatchRow
            key={match.id}
            match={match}
            now={now}
            prediction={matchPreds[match.id]}
            revealPending={isRevealPending(match, now)}
            onReveal={openReveal}
            onSkip={skipReveal}
          />
        ))}
      </div>
    </section>
  );
}
