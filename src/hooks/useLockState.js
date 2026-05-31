import { useEffect, useState } from 'react';
import {
  getGlobalDeadline,
  isGroupPhaseLocked,
  getKnockoutRoundState,
  STATE,
} from '../utils/lockRules.js';
import { useAllMatches, useKnockoutMatches } from './useMatches.js';

// Tick varje sekund så att UI uppdateras över tid (countdown).
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useLockState() {
  const now = useNow();
  const { matches: groupMatches, loading: mLoading } = useAllMatches();
  const { matches: koMatches, loading: kLoading } = useKnockoutMatches();
  const loading = mLoading || kLoading;

  const globalDeadline = loading ? null : getGlobalDeadline(groupMatches);
  const groupLocked = loading ? false : isGroupPhaseLocked(now, groupMatches);

  const rounds = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];
  const knockoutStates = {};
  for (const r of rounds) {
    knockoutStates[r] = loading
      ? STATE.NOT_AVAILABLE
      : getKnockoutRoundState(r, now, groupMatches, koMatches);
  }

  return {
    now,
    loading,
    globalDeadline,
    groupLocked,
    knockoutStates,
    STATE,
  };
}
