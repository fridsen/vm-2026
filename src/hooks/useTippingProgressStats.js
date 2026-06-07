import { usePredictions } from './usePredictions.js';
import { countTopThreeFilled, getTopThree } from '../utils/topThree.js';

const TOTAL_MATCHES = 72;
const TOTAL_GROUPS = 12;

export function useTippingProgressStats() {
  const { predictions } = usePredictions();
  const matchCount = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const rankedGroups = predictions
    ? Object.values(predictions.groupStandings || {}).filter((arr) => arr.length === 4).length
    : 0;
  const topThreeFilled = countTopThreeFilled(getTopThree(predictions));

  return {
    matchCount,
    totalMatches: TOTAL_MATCHES,
    rankedGroups,
    totalGroups: TOTAL_GROUPS,
    topThreeFilled,
  };
}
