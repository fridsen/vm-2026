import { useEffect, useMemo, useState } from 'react';
import { fetchLatestGroupPoints } from '../services/leaderboardService.js';
import { latestFinalizedGroup } from '../utils/latestFinalizedGroup.js';

/** Points per player for the most recently finalized group (null while loading). */
export function useLatestGroupPoints(matches) {
  const anchorGroup = useMemo(() => latestFinalizedGroup(matches), [matches]);
  const [latestPoints, setLatestPoints] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!anchorGroup) {
      setLatestPoints(null);
      return undefined;
    }

    setLatestPoints(null);
    fetchLatestGroupPoints(anchorGroup)
      .then((data) => {
        if (!cancelled) setLatestPoints(data);
      })
      .catch(() => {
        if (!cancelled) setLatestPoints({});
      });

    return () => {
      cancelled = true;
    };
  }, [anchorGroup]);

  return {
    anchorGroup,
    latestPoints,
    latestPointsReady: anchorGroup ? latestPoints !== null : false,
  };
}
