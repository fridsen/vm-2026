import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import LeaderboardRowFace from './LeaderboardRowFace.jsx';
import LeaderboardDayMatchRow from './LeaderboardDayMatchRow.jsx';
import { fetchUserMatchPredictionsForDay } from '../services/predictionsService.js';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const MORPH_MS = 360;

function overlayPortalTarget() {
  return document.querySelector('.phone-screen') ?? document.body;
}

function morphOffset(anchorRect, panelRect) {
  const ax = anchorRect.left + anchorRect.width / 2;
  const ay = anchorRect.top + anchorRect.height / 2;
  const px = panelRect.left + panelRect.width / 2;
  const py = panelRect.top + panelRect.height / 2;
  return { x: ax - px, y: ay - py };
}

export default function LeaderboardPlayerOverlay({ player, onClose }) {
  const open = player != null;
  const [phase, setPhase] = useState('idle');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [morphAnimating, setMorphAnimating] = useState(false);
  const [dayRows, setDayRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const anchorRectRef = useRef(null);
  const morphKeyRef = useRef(null);
  const morphTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const dayKey = format(new Date(), 'yyyy-MM-dd');
  const portalTarget = open ? overlayPortalTarget() : null;

  useEffect(() => {
    if (!open || !player?.userId) return undefined;

    setDayRows([]);
    setLoading(true);
    let cancelled = false;

    fetchUserMatchPredictionsForDay(player.userId, dayKey)
      .then((rows) => {
        if (cancelled) return;
        setDayRows(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setDayRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, player?.userId, dayKey]);

  useLayoutEffect(() => {
    if (!open || !player?.anchorRect) return undefined;

    const morphKey = player.userId;
    if (morphKeyRef.current === morphKey) return undefined;

    morphKeyRef.current = morphKey;
    anchorRectRef.current = player.anchorRect;
    setPhase('morph-in');
    setMorphAnimating(false);

    if (!panelRef.current) return undefined;

    const panelRect = panelRef.current.getBoundingClientRect();
    setOffset(morphOffset(anchorRectRef.current, panelRect));

    const raf = requestAnimationFrame(() => {
      setMorphAnimating(true);
      setOffset({ x: 0, y: 0 });
    });

    clearTimeout(morphTimerRef.current);
    morphTimerRef.current = window.setTimeout(() => {
      setPhase('ready');
    }, MORPH_MS);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [open, player?.userId, player?.anchorRect]);

  useLayoutEffect(() => {
    if (!open) {
      morphKeyRef.current = null;
      anchorRectRef.current = null;
      setPhase('idle');
      setOffset({ x: 0, y: 0 });
      setMorphAnimating(false);
      clearTimeout(morphTimerRef.current);
      clearTimeout(closeTimerRef.current);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (phase !== 'morph-out' || !anchorRectRef.current || !panelRef.current) {
      return undefined;
    }

    const panelRect = panelRef.current.getBoundingClientRect();
    const end = morphOffset(anchorRectRef.current, panelRect);
    setMorphAnimating(false);
    setOffset({ x: 0, y: 0 });

    const raf = requestAnimationFrame(() => {
      setMorphAnimating(true);
      setOffset(end);
    });

    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function requestClose() {
    if (!open || phase === 'morph-out' || phase === 'idle') {
      onClose?.();
      return;
    }
    clearTimeout(morphTimerRef.current);
    setPhase('morph-out');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => onClose?.(), MORPH_MS);
  }

  if (!open || !player?.anchorRect || !portalTarget || !player) return null;

  const panelStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: morphAnimating ? `transform ${MORPH_MS}ms ${EASE}` : 'none',
  };

  const showBody = phase === 'ready';

  return createPortal(
    <div className="lb-overlay-root" role="presentation">
      <button
        type="button"
        className={clsxPhase('lb-overlay-backdrop', phase)}
        aria-label="Stäng"
        onClick={requestClose}
      />
      <div className="lb-overlay-stage">
        <div
          ref={panelRef}
          className={clsxPhase('lb-overlay-panel', phase)}
          style={panelStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lb-overlay-player-name"
        >
          <div className="lb-overlay-header">
            <LeaderboardRowFace
              rank={player.rank}
              name={player.name}
              nameId="lb-overlay-player-name"
              points={player.points}
              movement={player.movement}
              showMovement={false}
              variant="overlay"
            />
          </div>

          {showBody ? (
            <div className="lb-overlay-body-shell">
              <div className="lb-overlay-body">
                <div className="lb-overlay-section-title">Dagens tippade matcher</div>

                {loading ? (
                  <p className="lb-overlay-empty">Laddar…</p>
                ) : dayRows.length === 0 ? (
                  <p className="lb-overlay-empty">Inga tippade matcher idag</p>
                ) : (
                  <div className="lb-overlay-matches">
                    {dayRows.map((row) => (
                      <LeaderboardDayMatchRow
                        key={row.matchId}
                        match={{
                          homeTeamId: row.homeTeamId,
                          awayTeamId: row.awayTeamId,
                        }}
                        prediction={row.prediction}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

function clsxPhase(base, phase) {
  if (phase === 'ready') return `${base} is-open`;
  if (phase === 'morph-in') return `${base} is-entering`;
  if (phase === 'morph-out') return `${base} is-closing`;
  return base;
}
