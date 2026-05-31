import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllPredictions,
  saveMatchPrediction,
  saveGroupStandingPrediction,
  saveTopScorerPrediction,
  saveKnockoutAdvance,
  saveBronzeWinner,
  saveWorldCupWinner,
  saveFinalists,
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
    const data = await fetchAllPredictions(userId);
    setPredictions(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateMatch = useCallback(
    async (matchId, { home, away, outcome }) => {
      await saveMatchPrediction(userId, matchId, { home, away, outcome });
      await refresh();
    },
    [userId, refresh]
  );

  const updateGroupStanding = useCallback(
    async (group, teamIds) => {
      await saveGroupStandingPrediction(userId, group, teamIds);
      await refresh();
    },
    [userId, refresh]
  );

  const updateTopScorers = useCallback(
    async (playerIds) => {
      await saveTopScorerPrediction(userId, playerIds);
      await refresh();
    },
    [userId, refresh]
  );

  const updateKnockoutAdvance = useCallback(
    async (round, matchId, teamId) => {
      await saveKnockoutAdvance(userId, round, matchId, teamId);
      await refresh();
    },
    [userId, refresh]
  );

  const updateBronze = useCallback(
    async (teamId) => {
      await saveBronzeWinner(userId, teamId);
      await refresh();
    },
    [userId, refresh]
  );

  const updateWinner = useCallback(
    async (teamId) => {
      await saveWorldCupWinner(userId, teamId);
      await refresh();
    },
    [userId, refresh]
  );

  const updateFinalists = useCallback(
    async (teamIds) => {
      await saveFinalists(userId, teamIds);
      await refresh();
    },
    [userId, refresh]
  );

  return {
    predictions,
    loading,
    refresh,
    updateMatch,
    updateGroupStanding,
    updateTopScorers,
    updateKnockoutAdvance,
    updateBronze,
    updateWinner,
    updateFinalists,
  };
}
