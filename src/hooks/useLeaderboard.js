import { useEffect, useState } from 'react';
import {
  fetchLeaderboard,
  fetchLeaderboardRank,
  fetchUserEntry,
} from '../services/leaderboardService.js';
import { useAuth } from './useAuth.js';

export function useLeaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchLeaderboard()
      .then((data) => {
        if (!mounted) return;
        setEntries(data);
      })
      .catch(() => {
        if (!mounted) return;
        setEntries([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { entries, loading };
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
      }
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
