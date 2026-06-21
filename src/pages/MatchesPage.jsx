import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { usePredictions } from '../hooks/usePredictions.js';
import MatchCard from '../components/MatchCard.jsx';
import PredictionSheet from '../components/PredictionSheet.jsx';
import { useResultReveal } from '../hooks/useResultReveal.js';
import { buildMatchDays } from '../utils/matchDays.js';
import { getMatchDayKey } from '../utils/matchSchedule.js';

export default function MatchesPage() {
  const { matches, loading } = useAllMatches();
  const { now, groupLocked } = useLockState();
  const { predictions, updateMatch } = usePredictions();
  const { isRevealPending, openReveal, skipReveal } = useResultReveal();
  const [predictMatch, setPredictMatch] = useState(null);
  const chipRefs = useRef(new Map());

  const todayKey = getMatchDayKey(new Date(now).toISOString());
  const days = useMemo(() => buildMatchDays(matches), [matches]);
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const activeDay = useMemo(() => {
    if (days.some((day) => day.dayKey === selectedDay)) return selectedDay;
    return days[0]?.dayKey || selectedDay;
  }, [days, selectedDay]);

  const selectedMatches = useMemo(
    () => days.find((day) => day.dayKey === activeDay)?.matches || [],
    [days, activeDay],
  );

  useEffect(() => {
    chipRefs.current.get(activeDay)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeDay]);

  const orderedMatches = useMemo(
    () => days.flatMap((day) => day.matches),
    [days],
  );
  const sheetIndex = predictMatch
    ? orderedMatches.findIndex((m) => m.id === predictMatch.id)
    : -1;
  const prevMatch = sheetIndex > 0 ? orderedMatches[sheetIndex - 1] : null;
  const nextMatch =
    sheetIndex >= 0 && sheetIndex < orderedMatches.length - 1
      ? orderedMatches[sheetIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="matches-page">
        <div className="card p-8 text-center text-neutral-500">Laddar matcher…</div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-date-carousel" aria-label="Välj matchdag">
        {days.map((day) => {
          const selected = day.dayKey === activeDay;
          return (
            <button
              key={day.dayKey}
              ref={(node) => {
                if (node) chipRefs.current.set(day.dayKey, node);
                else chipRefs.current.delete(day.dayKey);
              }}
              type="button"
              className={selected ? 'matches-date-chip is-selected' : 'matches-date-chip'}
              onClick={() => setSelectedDay(day.dayKey)}
              aria-pressed={selected}
            >
              <span>{format(day.date, 'EEE', { locale: sv })}</span>
              <strong>{format(day.date, 'd', { locale: sv })}</strong>
              <span>{format(day.date, 'MMM', { locale: sv })}</span>
            </button>
          );
        })}
      </div>

      <div className="matches-day-header">
        <span>{format(new Date(`${activeDay}T12:00:00`), 'EEEE d MMMM', { locale: sv })}</span>
        <span>{selectedMatches.length} matcher</span>
      </div>

      <div className="matches-card-list">
        {selectedMatches.length > 0 ? (
          selectedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              now={now}
              prediction={predictions?.matches?.[match.id]}
              onPredict={groupLocked ? undefined : () => setPredictMatch(match)}
              revealPending={isRevealPending(match, now)}
              onReveal={openReveal}
              onSkip={skipReveal}
            />
          ))
        ) : (
          <div className="card p-6 text-center text-sm text-neutral-500">
            Inga matcher den här dagen.
          </div>
        )}
      </div>

      <PredictionSheet
        match={predictMatch}
        prediction={predictMatch ? predictions?.matches?.[predictMatch.id] : null}
        disabled={groupLocked}
        onClose={() => setPredictMatch(null)}
        onSave={({ home, away, outcome }) => {
          if (predictMatch) updateMatch(predictMatch.id, { home, away, outcome });
        }}
        hasPrev={!!prevMatch}
        hasNext={!!nextMatch}
        onPrev={() => prevMatch && setPredictMatch(prevMatch)}
        onNext={() => nextMatch && setPredictMatch(nextMatch)}
      />
    </div>
  );
}
