import { computeGroupStandings } from './matchSchedule.js';
import { scoreGroupStanding } from './scoring.js';

const MATCHES_PER_GROUP = 6;

export function isGroupFinalized(group, matches) {
  const finished = (matches ?? []).filter(
    (m) => m.group === group && m.status === 'finished',
  ).length;
  return finished >= MATCHES_PER_GROUP;
}

export function orderedGroupPrediction(rankedIds, allTeamIds) {
  const ranked = rankedIds ?? [];
  const unranked = (allTeamIds ?? []).filter((id) => !ranked.includes(id));
  return [...ranked, ...unranked];
}

export function actualGroupTeamIds(groupMatches, teams) {
  if (!groupMatches?.length || !teams?.length) return [];
  const standings = computeGroupStandings(groupMatches, teams);
  return standings.map((row) => row.team.id);
}

/** Points earned at rank index 0–2; null for 4th place (no badge). */
export function groupRankPointsAtIndex(rankIndex, pred, actual, finalized) {
  if (rankIndex >= 3) return null;
  if (!finalized || !pred?.length || !actual?.length) return 0;
  if (rankIndex === 0) return pred[0] === actual[0] ? 2 : 0;
  if (rankIndex === 1) return pred[1] === actual[1] ? 1 : 0;
  if (rankIndex === 2) return pred[2] === actual[2] ? 1 : 0;
  return 0;
}

export function groupSheetTotalPoints(pred, actual, finalized) {
  if (!finalized) return 0;
  return scoreGroupStanding(pred, actual).points;
}
