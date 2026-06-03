import { useEffect, useState } from 'react';
import {
  getGlobalDeadline,
  isTournamentLocked,
  STATE,
} from '../utils/lockRules.js';
import { useAllMatches } from './useMatches.js';

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
  const { matches: groupMatches, loading } = useAllMatches();

  const globalDeadline = loading ? null : getGlobalDeadline(groupMatches);
  const tournamentLocked = loading ? false : isTournamentLocked(now, groupMatches);

  return {
    now,
    loading,
    globalDeadline,
    tournamentLocked,
    /** @deprecated use tournamentLocked */
    groupLocked: tournamentLocked,
    STATE,
  };
}
