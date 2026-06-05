import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppDataContext } from '../hooks/useAppData.js';
import { useAuth } from '../hooks/useAuth.js';
import { fetchAllMatches, fetchKnockoutMatches } from '../services/matchesService.js';
import { fetchLeaderboard } from '../services/leaderboardService.js';
import {
  fetchAllPredictions,
  saveMatchPrediction,
  saveGroupStandingPrediction,
  saveWorldCupTopThree,
} from '../services/predictionsService.js';
import { liveDataPollIntervalMs } from '../utils/liveDataRefresh.js';

export default function AppDataProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [groupMatches, setGroupMatches] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  const [entries, setEntries] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [predictions, setPredictions] = useState(null);
  const [predictionsLoading, setPredictionsLoading] = useState(Boolean(userId));

  const groupMatchesRef = useRef(groupMatches);
  groupMatchesRef.current = groupMatches;

  const refreshMatches = useCallback(async () => {
    try {
      const [group, knockout] = await Promise.all([fetchAllMatches(), fetchKnockoutMatches()]);
      setGroupMatches(group);
      setKnockoutMatches(knockout);
    } catch {
      /* keep cached data on transient failures */
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch {
      /* keep cached data on transient failures */
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const refreshLiveData = useCallback(async () => {
    await Promise.all([refreshMatches(), refreshLeaderboard()]);
  }, [refreshMatches, refreshLeaderboard]);

  useEffect(() => {
    let mounted = true;
    refreshMatches().finally(() => {
      if (mounted) setMatchesLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [refreshMatches]);

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
        if (mounted) setLeaderboardLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshLiveData();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refreshLiveData);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refreshLiveData);
    };
  }, [refreshLiveData]);

  useEffect(() => {
    let pollId = null;

    const syncPollInterval = () => {
      const ms = liveDataPollIntervalMs(groupMatchesRef.current);
      if (!ms) {
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
        return;
      }
      if (pollId) clearInterval(pollId);
      pollId = window.setInterval(() => {
        refreshLiveData();
      }, ms);
    };

    syncPollInterval();
    const watchId = window.setInterval(syncPollInterval, 15_000);

    return () => {
      if (pollId) clearInterval(pollId);
      clearInterval(watchId);
    };
  }, [refreshLiveData]);

  const refreshPredictions = useCallback(async () => {
    if (!userId) {
      setPredictions(null);
      setPredictionsLoading(false);
      return;
    }
    try {
      const data = await fetchAllPredictions(userId);
      setPredictions(data);
    } catch {
      setPredictions(null);
    } finally {
      setPredictionsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setPredictions(null);
        setPredictionsLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    setPredictionsLoading(true);
    fetchAllPredictions(userId)
      .then((data) => {
        if (!cancelled) setPredictions(data);
      })
      .catch(() => {
        if (!cancelled) setPredictions(null);
      })
      .finally(() => {
        if (!cancelled) setPredictionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateMatch = useCallback(
    async (matchId, { home, away, outcome }) => {
      if (!userId) return;
      await saveMatchPrediction(userId, matchId, { home, away, outcome });
      await refreshPredictions();
    },
    [userId, refreshPredictions],
  );

  const updateGroupStanding = useCallback(
    async (group, teamIds) => {
      if (!userId) return;
      await saveGroupStandingPrediction(userId, group, teamIds);
      await refreshPredictions();
    },
    [userId, refreshPredictions],
  );

  const updateTopThree = useCallback(
    async (topThree) => {
      if (!userId) return;
      await saveWorldCupTopThree(userId, topThree);
      await refreshPredictions();
    },
    [userId, refreshPredictions],
  );

  const value = useMemo(
    () => ({
      groupMatches,
      knockoutMatches,
      matchesLoading,
      entries,
      leaderboardLoading,
      predictions,
      predictionsLoading,
      refreshMatches,
      refreshLeaderboard,
      refreshLiveData,
      refreshPredictions,
      updateMatch,
      updateGroupStanding,
      updateTopThree,
    }),
    [
      groupMatches,
      knockoutMatches,
      matchesLoading,
      entries,
      leaderboardLoading,
      predictions,
      predictionsLoading,
      refreshMatches,
      refreshLeaderboard,
      refreshLiveData,
      refreshPredictions,
      updateMatch,
      updateGroupStanding,
      updateTopThree,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
