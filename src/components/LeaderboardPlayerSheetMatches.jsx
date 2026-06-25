import { useLayoutEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import TodayMatchRow from './matches/TodayMatchRow.jsx';
import { buildMatchDays } from '../utils/matchDays.js';
import {
  leaderboardSheetScrollDayKey,
  scrollSectionToTop,
} from '../utils/leaderboardSheetScroll.js';

export default function LeaderboardPlayerSheetMatches({
  matches,
  now,
  predictions,
  loading,
  sheetPhase,
  bodyRef,
  dayRefs,
}) {
  const days = useMemo(() => buildMatchDays(matches), [matches]);
  const scrollDayKey = useMemo(
    () => leaderboardSheetScrollDayKey(days, now),
    [days, now],
  );

  useLayoutEffect(() => {
    if (loading || sheetPhase !== 'idle' || !scrollDayKey) return undefined;

    const container = bodyRef.current;
    const section = dayRefs.current.get(scrollDayKey);
    if (!container || !section) return undefined;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollSectionToTop(container, section);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [loading, sheetPhase, scrollDayKey, bodyRef, dayRefs]);

  if (loading) {
    return <p className="lb-sheet-empty">Laddar…</p>;
  }

  if (days.length === 0) {
    return <p className="lb-sheet-empty">Inga matcher att visa</p>;
  }

  return days.map((day) => (
    <section
      key={day.dayKey}
      ref={(node) => {
        if (node) dayRefs.current.set(day.dayKey, node);
        else dayRefs.current.delete(day.dayKey);
      }}
      className="lb-sheet-day"
      data-day-key={day.dayKey}
    >
      <h3 className="lb-sheet-day-title">
        {format(day.date, 'EEEE d MMMM', { locale: sv })}
      </h3>
      <div className="lb-sheet-day-matches">
        {day.matches.map((match) => (
          <TodayMatchRow
            key={match.id}
            match={match}
            now={now}
            prediction={predictions[match.id]}
            showTipWithPoints
          />
        ))}
      </div>
    </section>
  ));
}
