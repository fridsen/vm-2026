import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { REVEAL_EVENT_CONFIG } from '../../utils/revealPhases.js';

export default function ResultRevealEventRow({ event }) {
  const cfg = REVEAL_EVENT_CONFIG[event.type] ?? REVEAL_EVENT_CONFIG.goal;
  const isHome = event.team === 'home';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={clsx(
        'result-reveal-event',
        isHome ? 'is-home' : 'is-away',
        visible && 'is-visible',
      )}
    >
      <div className="result-reveal-event-minute">
        <span>{event.minute}&apos;</span>
        <span
          className="result-reveal-event-badge"
          style={{ background: cfg.color, color: cfg.textColor }}
        >
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <div className="result-reveal-event-dot" aria-hidden />
      <div className="result-reveal-event-info">
        <span className="result-reveal-event-player">{event.player ?? '–'}</span>
        <span className="result-reveal-event-detail">{event.detail}</span>
      </div>
    </div>
  );
}
