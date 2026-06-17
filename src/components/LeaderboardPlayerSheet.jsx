import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import BottomSheet from './BottomSheet.jsx';
import TodayMatchRow from './matches/TodayMatchRow.jsx';
import { RankBadge } from './LeaderboardRowFace.jsx';
import { fetchUserMatchPredictions } from '../services/predictionsService.js';
import { buildMatchDays } from '../utils/matchDays.js';
import {
  leaderboardSheetScrollDayKey,
  scrollSectionToTop,
} from '../utils/leaderboardSheetScroll.js';

export default function LeaderboardPlayerSheet({ player, matches, now, onClose }) {
  const open = player != null;
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [sheetPhase, setSheetPhase] = useState(null);
  const bodyRef = useRef(null);
  const dayRefs = useRef(new Map());

  useEffect(() => {
    if (!open || !player?.userId) return undefined;

    setPredictions({});
    setLoading(true);
    let cancelled = false;

    fetchUserMatchPredictions(player.userId)
      .then((rows) => {
        if (!cancelled) setPredictions(rows ?? {});
      })
      .catch(() => {
        if (!cancelled) setPredictions({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, player?.userId]);

  const days = useMemo(() => buildMatchDays(matches), [matches]);
  const scrollDayKey = useMemo(
    () => leaderboardSheetScrollDayKey(days, now),
    [days, now],
  );

  useLayoutEffect(() => {
    if (!open || loading || sheetPhase !== 'idle' || !scrollDayKey) return undefined;

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
  }, [open, loading, sheetPhase, scrollDayKey, player?.userId]);

  useEffect(() => {
    if (!open) {
      dayRefs.current.clear();
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onPhaseChange={setSheetPhase}
      labelledBy="lb-sheet-player-name"
      padded={false}
      className="lb-player-sheet"
    >
      {player ? (
        <>
          <header className="lb-sheet-header">
            <div className="lb-sheet-header-left">
              <RankBadge rank={player.rank} className="lb-sheet-rank" />
              <span className="lb-sheet-name" id="lb-sheet-player-name">
                {player.name}
              </span>
            </div>
            <span className="lb-sheet-points">{player.points}</span>
          </header>

          <div ref={bodyRef} className="lb-sheet-body">
            {loading ? (
              <p className="lb-sheet-empty">Laddar…</p>
            ) : days.length === 0 ? (
              <p className="lb-sheet-empty">Inga matcher att visa</p>
            ) : (
              days.map((day) => (
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
              ))
            )}
          </div>
        </>
      ) : null}
    </BottomSheet>
  );
}
