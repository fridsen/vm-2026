import { createPortal } from 'react-dom';
import { useState } from 'react';
import { REVEAL_PHASE } from '../../utils/revealPhases.js';
import ResultRevealIntro from './ResultRevealIntro.jsx';
import ResultRevealTicker from './ResultRevealTicker.jsx';

function portalTarget() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('.phone-screen') ?? document.body;
}

export default function ResultRevealOverlay({
  open,
  match,
  phase,
  visibleEvents,
  progress,
  scoreRevealed,
  predictionRevealed,
  pointsRevealed,
  countingPoints,
  introStep,
  countdown,
  onClose,
  onDone,
}) {
  const [target] = useState(portalTarget);

  if (!open || !match || !target) return null;

  return createPortal(
    <div
      className="result-reveal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Resultatuppläsning"
    >
      <button
        type="button"
        className="result-reveal-close"
        onClick={onClose}
        aria-label="Stäng"
      >
        ✕
      </button>

      {phase === REVEAL_PHASE.INTRO ? (
        <ResultRevealIntro match={match} introStep={introStep} countdown={countdown} />
      ) : (
        <ResultRevealTicker
          match={match}
          phase={phase}
          visibleEvents={visibleEvents}
          progress={progress}
          scoreRevealed={scoreRevealed}
          predictionRevealed={predictionRevealed}
          pointsRevealed={pointsRevealed}
          countingPoints={countingPoints}
          onDone={onDone}
        />
      )}
    </div>,
    target,
  );
}
