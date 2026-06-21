import { useCallback, useState } from 'react';
import { useAuth } from './useAuth.js';
import {
  clearSeenMatchIds,
  isMatchSeen,
  markMatchSeen,
} from '../utils/resultRevealStorage.js';

export function useResultRevealSeen() {
  const { user } = useAuth();
  const userId = user?.id;
  const [revision, setRevision] = useState(0);

  const isSeen = useCallback(
    (matchId) => {
      if (!userId || !matchId) return true;
      void revision;
      return isMatchSeen(userId, matchId);
    },
    [userId, revision],
  );

  const markSeen = useCallback(
    (matchId) => {
      if (!userId || !matchId) return;
      markMatchSeen(userId, matchId);
      setRevision((v) => v + 1);
    },
    [userId],
  );

  const clearSeen = useCallback(() => {
    if (!userId) return;
    clearSeenMatchIds(userId);
    setRevision((v) => v + 1);
  }, [userId]);

  return { isSeen, markSeen, clearSeen };
}
