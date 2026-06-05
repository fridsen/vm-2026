import { useEffect, useState } from 'react';
import {
  fetchLeaderboard,
  fetchLeaderboardRank,
  fetchUserEntry,
} from '../services/leaderboardService.js';
import { useAuth } from './useAuth.js';
import { useAppData } from './useAppData.js';

export function useLeaderboard() {
  const { entries, leaderboardLoading, refreshLeaderboard, refreshLiveData } = useAppData();
  return {
    entries,
    loading: leaderboardLoading,
    refresh: refreshLeaderboard,
    refreshLiveData,
  };
}

export function useMyRank(explicitUserId) {
  const { user } = useAuth();
  const userId = explicitUserId || user?.id;
  const [rank, setRank] = useState(null);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    if (!userId) {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        setRank(null);
        setEntry(null);
      });
      return () => {
        cancelled = true;
      };
    }
    let mounted = true;
    Promise.all([fetchLeaderboardRank(userId), fetchUserEntry(userId)]).then(
      ([r, e]) => {
        if (!mounted) return;
        setRank(r);
        setEntry(e);
      },
    ).catch(() => {
      if (!mounted) return;
      setRank(null);
      setEntry(null);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { rank, entry };
}
