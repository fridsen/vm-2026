import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  BARS_IN_VIEW,
  buildPerMatchPoints,
  perMatchScrollIndex,
} from '../../utils/matchPointsPerGame.js';

function resolveTooltipAlign({ wrap, tooltip, boundary }) {
  const boundaryRect = boundary.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth;
  const edgePadding = 4;
  const barCenter = wrapRect.left + wrapRect.width / 2;
  const idealLeft = barCenter - tooltipWidth / 2;
  const minLeft = boundaryRect.left + edgePadding;
  const maxLeft = boundaryRect.right - edgePadding - tooltipWidth;

  if (idealLeft < minLeft) return 'start';
  if (idealLeft > maxLeft) return 'end';
  return 'center';
}

function MatchBar({ item, active, onToggle, boundaryRef, scrollRef }) {
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);
  const [tooltipAlign, setTooltipAlign] = useState('center');
  const fillPct = item.pending ? 0 : Math.min(100, (item.earned / item.max) * 100);
  const hasResult = !item.pending;

  useLayoutEffect(() => {
    if (!active) return undefined;

    const updateAlign = () => {
      const boundary = boundaryRef?.current;
      const wrap = wrapRef.current;
      const tooltip = tooltipRef.current;
      if (!boundary || !wrap || !tooltip) return;
      setTooltipAlign(resolveTooltipAlign({ wrap, tooltip, boundary }));
    };

    updateAlign();
    const scrollEl = scrollRef?.current;
    scrollEl?.addEventListener('scroll', updateAlign, { passive: true });
    window.addEventListener('resize', updateAlign);
    return () => {
      scrollEl?.removeEventListener('scroll', updateAlign);
      window.removeEventListener('resize', updateAlign);
    };
  }, [active, boundaryRef, scrollRef, item.earned]);

  return (
    <div ref={wrapRef} className={clsx('live-ppm-bar-wrap', active && 'is-active')}>
      {active ? (
        <div
          ref={tooltipRef}
          className={clsx('live-ppm-tooltip', `is-align-${tooltipAlign}`)}
          role="tooltip"
        >
          {item.earned} poäng
        </div>
      ) : null}
      <button
        type="button"
        className="live-ppm-bar-btn"
        disabled={!hasResult}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(item.matchId);
        }}
        aria-label={
          hasResult ? `Match ${item.index}: ${item.earned} poäng` : `Match ${item.index}`
        }
        aria-expanded={active}
      >
        <div className="live-ppm-bar" aria-hidden>
          {!item.pending && fillPct > 0 ? (
            <div
              className={`live-ppm-bar-fill${item.perfect ? ' is-perfect' : ''}`}
              style={{ height: `${fillPct}%` }}
            />
          ) : null}
        </div>
      </button>
      <span className="live-ppm-label">{item.index}</span>
    </div>
  );
}

export default function LivePointsPerMatch({ matches, predictions }) {
  const cardRef = useRef(null);
  const scrollRef = useRef(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const items = useMemo(
    () => buildPerMatchPoints(matches, predictions),
    [matches, predictions],
  );
  const scrollIndex = useMemo(() => perMatchScrollIndex(items), [items]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const barStep = 28; /* 12px bar + 16px gap */
    el.scrollTo({ left: scrollIndex * barStep, behavior: 'smooth' });
  }, [scrollIndex]);

  useEffect(() => {
    if (!activeMatchId) return undefined;
    const close = () => setActiveMatchId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [activeMatchId]);

  const handleToggle = (matchId) => {
    setActiveMatchId((prev) => (prev === matchId ? null : matchId));
  };

  if (items.length === 0) return null;

  return (
    <section ref={cardRef} className="live-ppm-card">
      <p className="live-ppm-title">Poäng per match</p>
      <div
        ref={scrollRef}
        className="live-ppm-scroll"
        style={{ '--ppm-visible-bars': BARS_IN_VIEW }}
      >
        <div className="live-ppm-track">
          {items.map((item) => (
            <div key={item.matchId} data-match-index={item.index}>
              <MatchBar
                item={item}
                active={activeMatchId === item.matchId}
                onToggle={handleToggle}
                boundaryRef={cardRef}
                scrollRef={scrollRef}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
