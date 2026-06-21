import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResultRevealContext } from './ResultRevealContext.js';
import { useAppData } from '../../hooks/useAppData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useRevealSequence } from '../../hooks/useRevealSequence.js';
import { useResultRevealSeen } from '../../hooks/useResultRevealSeen.js';
import { useTeams } from '../../hooks/useTeams.js';
import { buildRevealMatch, REVEAL_DEMO_MATCH } from '../../utils/buildRevealMatch.js';
import { MATCH_STATE, getMatchState } from '../../utils/matchSchedule.js';
import ResultRevealOverlay from './ResultRevealOverlay.jsx';

export default function ResultRevealProvider({ children }) {
  const { user } = useAuth();
  const { getTeamById } = useTeams();
  const { groupMatches, predictions, matchEventsById } = useAppData();
  const { isSeen, markSeen, clearSeen } = useResultRevealSeen();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeMatch, setActiveMatch] = useState(null);
  const {
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
  } = useRevealSequence();
  const startedRef = useRef(false);

  const buildForMatchId = useCallback(
    (matchId) => {
      const match = groupMatches.find((m) => m.id === matchId);
      if (!match) return null;
      return buildRevealMatch({
        match,
        prediction: predictions?.matches?.[matchId],
        homeTeam: getTeamById(match.homeTeamId),
        awayTeam: getTeamById(match.awayTeamId),
        events: matchEventsById[matchId] ?? [],
      });
    },
    [groupMatches, predictions, getTeamById, matchEventsById],
  );

  const closeReveal = useCallback(
    (shouldMarkSeen = true) => {
      if (shouldMarkSeen && activeMatch?.matchId && activeMatch.matchId !== '__demo__') {
        markSeen(activeMatch.matchId);
      }
      reset();
      setActiveMatch(null);
      startedRef.current = false;
    },
    [activeMatch, markSeen, reset],
  );

  const openReveal = useCallback(
    (matchId) => {
      const payload = buildForMatchId(matchId);
      if (!payload) return;
      startedRef.current = false;
      reset();
      setActiveMatch(payload);
    },
    [buildForMatchId, reset],
  );

  const openDemo = useCallback(() => {
    startedRef.current = false;
    reset();
    setActiveMatch(REVEAL_DEMO_MATCH);
  }, [reset]);

  const openFirstFinished = useCallback(
    (now = Date.now()) => {
      const match = groupMatches.find(
        (m) => getMatchState(m, now) === MATCH_STATE.FINISHED && m.result,
      );
      if (match) openReveal(match.id);
    },
    [groupMatches, openReveal],
  );

  const skipReveal = useCallback(
    (matchId) => {
      markSeen(matchId);
    },
    [markSeen],
  );

  const isRevealPending = useCallback(
    (match, now = Date.now()) => {
      if (!match || !user?.id) return false;
      return getMatchState(match, now) === MATCH_STATE.FINISHED && !isSeen(match.id);
    },
    [user?.id, isSeen],
  );

  useEffect(() => {
    if (!activeMatch || startedRef.current) return;
    startedRef.current = true;
    start(activeMatch);
  }, [activeMatch, start]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const reset = searchParams.get('revealReset') === '1';
    const demo = searchParams.get('revealDemo') === '1';
    if (!reset && !demo) return undefined;

    const timer = window.setTimeout(() => {
      if (reset) clearSeen();
      if (demo) openDemo();
      const next = new URLSearchParams(searchParams);
      next.delete('revealReset');
      next.delete('revealDemo');
      setSearchParams(next, { replace: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams, setSearchParams, clearSeen, openDemo]);

  const value = useMemo(
    () => ({
      isSeen,
      isRevealPending,
      openReveal,
      openDemo,
      openFirstFinished,
      skipReveal,
      clearSeen,
      isOverlayOpen: isOverlay,
    }),
    [
      isSeen,
      isRevealPending,
      openReveal,
      openDemo,
      openFirstFinished,
      skipReveal,
      clearSeen,
      isOverlay,
    ],
  );

  return (
    <ResultRevealContext.Provider value={value}>
      {children}
      <ResultRevealOverlay
        open={isOverlay}
        match={activeMatch}
        phase={phase}
        visibleEvents={visibleEvents}
        progress={progress}
        scoreRevealed={scoreRevealed}
        predictionRevealed={predictionRevealed}
        pointsRevealed={pointsRevealed}
        countingPoints={countingPoints}
        introStep={introStep}
        countdown={countdown}
        onClose={() => closeReveal(true)}
        onDone={() => closeReveal(true)}
      />
    </ResultRevealContext.Provider>
  );
}
