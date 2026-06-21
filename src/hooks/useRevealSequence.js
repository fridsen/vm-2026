import { useCallback, useEffect, useRef, useState } from 'react';
import { REVEAL_PHASE } from '../utils/revealPhases.js';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const INTRO_TOTAL_MS = 5800;
const COUNTDOWN_STEP_MS = 800;

export function useRevealSequence() {
  const [phase, setPhase] = useState(REVEAL_PHASE.IDLE);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [progress, setProgress] = useState(0);
  const [scoreRevealed, setScoreRevealed] = useState(false);
  const [predictionRevealed, setPredictionRevealed] = useState(false);
  const [pointsRevealed, setPointsRevealed] = useState(false);
  const [countingPoints, setCountingPoints] = useState(0);
  const [introStep, setIntroStep] = useState(0);
  const [countdown, setCountdown] = useState(null);

  const abortRef = useRef(false);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true;
    runningRef.current = false;
    setPhase(REVEAL_PHASE.IDLE);
    setVisibleEvents([]);
    setProgress(0);
    setScoreRevealed(false);
    setPredictionRevealed(false);
    setPointsRevealed(false);
    setCountingPoints(0);
    setIntroStep(0);
    setCountdown(null);
  }, []);

  const start = useCallback(async (matchData) => {
    if (!matchData || runningRef.current) return;
    runningRef.current = true;
    abortRef.current = false;

    setPhase(REVEAL_PHASE.INTRO);
    setIntroStep(0);
    setCountdown(null);

    await sleep(400);
    if (abortRef.current) return;
    setIntroStep(1);
    await sleep(700);
    if (abortRef.current) return;
    setIntroStep(2);
    await sleep(700);
    if (abortRef.current) return;
    setIntroStep(3);
    await sleep(700);
    if (abortRef.current) return;
    setIntroStep(4);

    for (const n of [3, 2, 1, 0]) {
      setCountdown(n);
      await sleep(COUNTDOWN_STEP_MS);
      if (abortRef.current) return;
    }
    setCountdown(null);

    const introRemainder = INTRO_TOTAL_MS - 400 - 700 - 700 - 700 - 4 * COUNTDOWN_STEP_MS;
    if (introRemainder > 0) {
      await sleep(introRemainder);
      if (abortRef.current) return;
    }

    setPhase(REVEAL_PHASE.TICKER);
    await sleep(600);
    if (abortRef.current) return;

    const events = matchData.events ?? [];
    for (let i = 0; i < events.length; i += 1) {
      if (abortRef.current) return;
      await sleep(i === 0 ? 400 : 1100);
      if (abortRef.current) return;
      const ev = events[i];
      setVisibleEvents((prev) => [...prev, ev]);
      setProgress(Math.round((ev.minute / 90) * 100));
    }

    await sleep(1400);
    if (abortRef.current) return;
    setProgress(100);
    await sleep(700);
    if (abortRef.current) return;

    setPhase(REVEAL_PHASE.SCORE);
    await sleep(200);
    if (abortRef.current) return;
    setScoreRevealed(true);
    await sleep(1800);
    if (abortRef.current) return;

    setPhase(REVEAL_PHASE.PREDICTION);
    await sleep(300);
    if (abortRef.current) return;
    setPredictionRevealed(true);
    await sleep(1600);
    if (abortRef.current) return;

    setPhase(REVEAL_PHASE.POINTS);
    await sleep(300);
    if (abortRef.current) return;
    setPointsRevealed(true);

    const target = matchData.userPoints ?? 0;
    let c = 0;
    const step = Math.max(1, Math.floor(target / 12) || 1);
    while (c < target) {
      await sleep(80);
      if (abortRef.current) return;
      c = Math.min(c + step, target);
      setCountingPoints(c);
    }

    runningRef.current = false;
  }, []);

  useEffect(() => () => {
    abortRef.current = true;
    runningRef.current = false;
  }, []);

  const isOverlay = phase !== REVEAL_PHASE.IDLE;

  return {
    phase,
    visibleEvents,
    progress,
    scoreRevealed,
    predictionRevealed,
    pointsRevealed,
    countingPoints,
    introStep,
    countdown,
    isOverlay,
    start,
    reset,
  };
}
