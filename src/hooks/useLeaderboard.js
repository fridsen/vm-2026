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
    fetchLeaderboard().then((data) => {
      if (!mounted) return;
      setEntries(data);
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
      setRank(null);
      setEntry(null);
      return;
    }
    let mounted = true;
    Promise.all([fetchLeaderboardRank(userId), fetchUserEntry(userId)]).then(
      ([r, e]) => {
        if (!mounted) return;
        setRank(r);
        setEntry(e);
      }
    );
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { rank, entry };
}
