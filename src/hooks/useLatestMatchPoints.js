import { useEffect, useMemo, useState } from 'react';
import { fetchLatestMatchPoints } from '../services/leaderboardService.js';
import { latestFinishedMatches } from '../utils/leaderboardMovement.js';

/** Points earned on the most recently finished kickoff slot (null while loading). */
export function useLatestMatchPoints(matches) {
  const anchorMatches = useMemo(() => latestFinishedMatches(matches), [matches]);
  const anchorMatchIds = useMemo(
    () => anchorMatches.map((m) => m.id),
    [anchorMatches],
  );
  const anchorMatchId = anchorMatchIds[0] ?? null;
  const [latestData, setLatestData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!anchorMatchIds.length) {
      setLatestData(null);
      return undefined;
    }

    setLatestData(null);
    fetchLatestMatchPoints(anchorMatchIds)
      .then((data) => {
        if (!cancelled) setLatestData(data);
      })
      .catch(() => {
        if (!cancelled) setLatestData({ totals: {}, breakdown: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [anchorMatchIds.join(',')]);

  return {
    anchorMatchId,
    anchorMatchIds,
    anchorMatches,
    latestPoints: latestData?.totals ?? null,
    latestPointsBreakdown: latestData?.breakdown ?? null,
    latestPointsReady: latestData !== null,
  };
}
