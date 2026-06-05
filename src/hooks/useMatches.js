import { useEffect, useState } from 'react';
import {
  fetchAllMatches,
  fetchMatchesByGroup,
  fetchKnockoutMatches,
} from '../services/matchesService.js';
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

export function useGroupMatches(group) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMatchesByGroup(group).then((data) => {
      if (!mounted) return;
      setMatches(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [group]);

  return { matches, loading };
}
