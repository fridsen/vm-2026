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
import { fetchLatestNews, getCachedNews, NEWS_ARTICLE_LIMIT } from '../services/newsService.js';
import { interleaveNewsBySource } from '../utils/interleaveNewsBySource.js';
import { liveDataPollIntervalMs } from '../utils/liveDataRefresh.js';
import { hasStaleLiveMatches } from '../utils/staleLiveMatches.js';
import {
  finishedMatchesSignature,
} from '../utils/leaderboardMovement.js';
import { NEWS_CACHE_TTL_MS, readNewsCache } from '../utils/newsCache.js';

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

  const [newsArticles, setNewsArticles] = useState(() => {
    const cached = getCachedNews(NEWS_ARTICLE_LIMIT);
    return cached ? interleaveNewsBySource(cached) : [];
  });
  const [newsLoading, setNewsLoading] = useState(() => getCachedNews(NEWS_ARTICLE_LIMIT) == null);

  const groupMatchesRef = useRef(groupMatches);
  const knockoutMatchesRef = useRef(knockoutMatches);
  groupMatchesRef.current = groupMatches;
  knockoutMatchesRef.current = knockoutMatches;

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

  /** Refresh match scores for live cards; leaderboard when any match finishes. */
  const refreshLiveData = useCallback(async () => {
    const prevSignature = finishedMatchesSignature(
      groupMatchesRef.current,
      knockoutMatchesRef.current,
    );
    try {
      const [group, knockout] = await Promise.all([fetchAllMatches(), fetchKnockoutMatches()]);
      setGroupMatches(group);
      setKnockoutMatches(knockout);
      const nextSignature = finishedMatchesSignature(group, knockout);
      if (nextSignature !== prevSignature) {
        const data = await fetchLeaderboard();
        setEntries(data);
      }
    } catch {
      /* keep cached data on transient failures */
    } finally {
      setMatchesLoading(false);
      setLeaderboardLoading(false);
    }
  }, []);

  const refreshNews = useCallback(async ({ force = false } = {}) => {
    try {
      const data = await fetchLatestNews(NEWS_ARTICLE_LIMIT, { force });
      setNewsArticles(data);
    } catch {
      /* keep cached headlines on transient failures */
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readNewsCache();
    if (cached?.fresh) {
      setNewsArticles(interleaveNewsBySource(cached.articles.slice(0, NEWS_ARTICLE_LIMIT)));
      setNewsLoading(false);
      fetchLatestNews(NEWS_ARTICLE_LIMIT, { force: true })
        .then(setNewsArticles)
        .catch(() => {});
      return undefined;
    }

    let mounted = true;
    refreshNews({ force: Boolean(cached) }).finally(() => {
      if (mounted) setNewsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [refreshNews]);

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
      if (document.visibilityState === 'visible') {
        refreshLiveData();
        refreshNews({ force: true });
      }
    };

    const onFocus = () => {
      refreshLiveData();
      refreshNews({ force: true });
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshLiveData, refreshNews]);

  useEffect(() => {
    const pollId = window.setInterval(() => {
      refreshNews({ force: true });
    }, NEWS_CACHE_TTL_MS);

    return () => clearInterval(pollId);
  }, [refreshNews]);

  useEffect(() => {
    let pollId = null;

    const syncPollInterval = () => {
      const stale = hasStaleLiveMatches(
        groupMatchesRef.current,
        knockoutMatchesRef.current,
      );
      const ms = stale
        ? 10_000
        : liveDataPollIntervalMs(
            groupMatchesRef.current,
            knockoutMatchesRef.current,
          );
      if (!ms) {
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
        return;
      }
      if (pollId) clearInterval(pollId);
      refreshLiveData();
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
      newsArticles,
      newsLoading,
      refreshMatches,
      refreshLeaderboard,
      refreshLiveData,
      refreshNews,
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
      newsArticles,
      newsLoading,
      refreshMatches,
      refreshLeaderboard,
      refreshLiveData,
      refreshNews,
      refreshPredictions,
      updateMatch,
      updateGroupStanding,
      updateTopThree,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
