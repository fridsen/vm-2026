import { useEffect, useState } from 'react';
import {
  getGlobalDeadline,
  isTournamentLocked,
  STATE,
} from '../utils/lockRules.js';
import { supabase } from '../services/supabaseClient.js';
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
  const [serverDeadline, setServerDeadline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('fn_global_deadline').then(({ data, error }) => {
      if (!cancelled && !error) setServerDeadline(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const globalDeadline =
    getGlobalDeadline(groupMatches) ?? serverDeadline ?? null;

  const tournamentLocked = globalDeadline
    ? new Date(now) >= new Date(globalDeadline)
    : loading
      ? false
      : isTournamentLocked(now, groupMatches);

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
