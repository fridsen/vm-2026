import { useAppData } from './useAppData.js';

export function useAllMatches() {
  const { groupMatches, matchesLoading, refreshMatches, refreshLiveData } = useAppData();
  return {
    matches: groupMatches,
    loading: matchesLoading,
    refresh: refreshMatches,
    refreshLiveData,
  };
}

export function useKnockoutMatches() {
  const { knockoutMatches, matchesLoading } = useAppData();
  return { matches: knockoutMatches, loading: matchesLoading };
}
