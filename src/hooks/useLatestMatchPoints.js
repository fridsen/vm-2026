import { useEffect, useMemo, useState } from 'react';
import { fetchLatestMatchPoints } from '../services/leaderboardService.js';
import { latestFinishedMatchId } from '../utils/leaderboardMovement.js';

/** Points earned on the most recently finished group match (null while loading). */
export function useLatestMatchPoints(matches) {
  const anchorMatchId = useMemo(() => latestFinishedMatchId(matches), [matches]);
  const [latestPoints, setLatestPoints] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!anchorMatchId) {
      setLatestPoints(null);
      return undefined;
    }

    setLatestPoints(null);
    fetchLatestMatchPoints(anchorMatchId)
      .then((data) => {
        if (!cancelled) setLatestPoints(data);
      })
      .catch(() => {
        if (!cancelled) setLatestPoints({});
      });

    return () => {
      cancelled = true;
    };
  }, [anchorMatchId]);

  return {
    anchorMatchId,
    latestPoints,
    latestPointsReady: latestPoints !== null,
  };
}
