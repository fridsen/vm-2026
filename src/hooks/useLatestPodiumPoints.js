import { useEffect, useMemo, useState } from 'react';
import { fetchLatestPodiumPoints } from '../services/leaderboardService.js';
import { latestFinishedMatches } from '../utils/leaderboardMovement.js';
import { isKnockoutMatch } from '../utils/matchSchedule.js';

/** Points from the most recently finished FINAL/BRONZE match (null while loading). */
export function useLatestPodiumPoints(matches) {
  const podiumMatches = useMemo(
    () =>
      latestFinishedMatches(
        (matches ?? []).filter(
          (m) => isKnockoutMatch(m) && (m.round === 'FINAL' || m.round === 'BRONZE'),
        ),
      ),
    [matches],
  );
  const anchorMatch = podiumMatches[0] ?? null;
  const [latestPoints, setLatestPoints] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!anchorMatch) {
      setLatestPoints(null);
      return undefined;
    }

    setLatestPoints(null);
    fetchLatestPodiumPoints()
      .then((data) => {
        if (!cancelled) setLatestPoints(data);
      })
      .catch(() => {
        if (!cancelled) setLatestPoints({});
      });

    return () => {
      cancelled = true;
    };
  }, [anchorMatch?.id, anchorMatch?.kickoff]);

  return {
    anchorMatch,
    latestPodiumKickoff: anchorMatch?.kickoff ?? null,
    latestPodiumPoints: latestPoints,
    latestPodiumPointsReady: anchorMatch ? latestPoints !== null : false,
  };
}
