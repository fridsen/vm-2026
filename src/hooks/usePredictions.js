import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllPredictions,
  saveMatchPrediction,
  saveGroupStandingPrediction,
  saveWorldCupWinner,
} from '../services/predictionsService.js';
import { useAuth } from './useAuth.js';

export function usePredictions(userId) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  return usePredictionsImpl(effectiveUserId);
}

function usePredictionsImpl(userId) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setPredictions(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchAllPredictions(userId);
      setPredictions(data);
    } catch {
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const updateMatch = useCallback(
    async (matchId, { home, away, outcome }) => {
      await saveMatchPrediction(userId, matchId, { home, away, outcome });
      await refresh();
    },
    [userId, refresh],
  );

  const updateGroupStanding = useCallback(
    async (group, teamIds) => {
      await saveGroupStandingPrediction(userId, group, teamIds);
      await refresh();
    },
    [userId, refresh],
  );

  const updateWinner = useCallback(
    async (teamId) => {
      await saveWorldCupWinner(userId, teamId);
      await refresh();
    },
    [userId, refresh],
  );

  return {
    predictions,
    loading,
    refresh,
    updateMatch,
    updateGroupStanding,
    updateWinner,
  };
}
