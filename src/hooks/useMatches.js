import { useMemo } from 'react';
import { useAppData } from './useAppData.js';
import { compareMatchesByKickoff } from '../utils/matchSchedule.js';

export function useAllMatches() {
  const { groupMatches, matchesLoading, refreshMatches, refreshLiveData } = useAppData();
  return {
    matches: groupMatches,
    loading: matchesLoading,
    refresh: refreshMatches,
    refreshLiveData,
  };
}

/** Group-stage + knockout fixtures in kickoff order (Matcher tab, player sheet). */
export function useTournamentMatches() {
  const { groupMatches, knockoutMatches, matchesLoading, refreshMatches, refreshLiveData } =
    useAppData();
  const matches = useMemo(
    () =>
      [...(groupMatches ?? []), ...(knockoutMatches ?? [])].sort(compareMatchesByKickoff),
    [groupMatches, knockoutMatches],
  );
  return {
    matches,
    loading: matchesLoading,
    refresh: refreshMatches,
    refreshLiveData,
  };
}

export function useKnockoutMatches() {
  const { knockoutMatches, matchesLoading } = useAppData();
  return { matches: knockoutMatches, loading: matchesLoading };
}
