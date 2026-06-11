import { scoreGroupMatch } from './scoring.js';

export const MAX_MATCH_POINTS = 6;

/** How many finished bars to keep in view before upcoming matches. */
export const SCORED_BARS_IN_VIEW = 10;

/** Total bars visible in the scroll window (finished + upcoming preview). */
export const BARS_IN_VIEW = 12;

/**
 * Per-match points in kickoff order for the dashboard bar chart.
 * Upcoming matches have earned=0 and pending=true.
 */
export function buildPerMatchPoints(matches, predictions) {
  const ordered = [...(matches ?? [])].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const matchPreds = predictions?.matches ?? {};

  return ordered.map((match, index) => {
    const finished = match.status === 'finished' && match.result != null;
    if (!finished) {
      return {
        index: index + 1,
        matchId: match.id,
        earned: 0,
        max: MAX_MATCH_POINTS,
        pending: true,
        perfect: false,
      };
    }

    const { points } = scoreGroupMatch(matchPreds[match.id], match.result);
    return {
      index: index + 1,
      matchId: match.id,
      earned: points,
      max: MAX_MATCH_POINTS,
      pending: false,
      perfect: points === MAX_MATCH_POINTS,
    };
  });
}

/** Scroll offset so ~10 scored bars + upcoming preview stay visible. */
export function perMatchScrollIndex(items) {
  const finishedCount = items.filter((item) => !item.pending).length;
  if (finishedCount <= SCORED_BARS_IN_VIEW) return 0;
  return finishedCount - SCORED_BARS_IN_VIEW;
}
