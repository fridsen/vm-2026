import { useCallback } from 'react';
import { useAuth } from './useAuth.js';
import { useAppData } from './useAppData.js';

export function usePredictions(userId) {
  const { user } = useAuth();
  const {
    predictions,
    predictionsLoading,
    refreshPredictions,
    updateMatch,
    updateGroupStanding,
    updateTopThree,
  } = useAppData();

  const refresh = useCallback(async () => {
    await refreshPredictions();
  }, [refreshPredictions]);

  // Optional explicit userId is ignored unless it matches the signed-in user —
  // the provider always scopes predictions to the current session.
  if (userId && userId !== user?.id) {
    return {
      predictions: null,
      loading: false,
      refresh,
      updateMatch: async () => {},
      updateGroupStanding: async () => {},
      updateTopThree: async () => {},
    };
  }

  return {
    predictions,
    loading: predictionsLoading,
    refresh,
    updateMatch,
    updateGroupStanding,
    updateTopThree,
  };
}
