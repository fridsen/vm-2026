import { scoreTopThree } from './scoring.js';
import { isKnockoutMatch } from './matchSchedule.js';
import { normalizeTopThree } from './topThree.js';

const PODIUM_POINTS = [15, 10, 5];

function knockoutWinner(match) {
  if (!match?.result) return null;
  const { home, away } = match.result;
  if (home === away) return null;
  return home > away ? match.homeTeamId : match.awayTeamId;
}

function knockoutRunnerUp(match) {
  if (!match?.result) return null;
  const { home, away } = match.result;
  if (home === away) return null;
  return home > away ? match.awayTeamId : match.homeTeamId;
}

export function isPodiumFinalized(knockoutMatches) {
  const finals = (knockoutMatches ?? []).filter((m) => m.round === 'FINAL');
  const bronzes = (knockoutMatches ?? []).filter((m) => m.round === 'BRONZE');
  const finalWinner = finals.map(knockoutWinner).find(Boolean);
  const bronzeWinner = bronzes.map(knockoutWinner).find(Boolean);
  return Boolean(finalWinner && bronzeWinner);
}

export function actualTopThreeTeamIds(knockoutMatches) {
  if (!isPodiumFinalized(knockoutMatches)) return [];
  const finalMatch = (knockoutMatches ?? []).find((m) => m.round === 'FINAL' && knockoutWinner(m));
  const bronzeMatch = (knockoutMatches ?? []).find((m) => m.round === 'BRONZE' && knockoutWinner(m));
  if (!finalMatch || !bronzeMatch) return [];
  return [
    knockoutWinner(finalMatch),
    knockoutRunnerUp(finalMatch),
    knockoutWinner(bronzeMatch),
  ].filter(Boolean);
}

export function topThreeRankPointsAtIndex(rankIndex, pred, actual, finalized) {
  const max = PODIUM_POINTS[rankIndex];
  if (max == null) return null;
  if (!finalized) return 0;
  const p = normalizeTopThree(pred);
  const a = normalizeTopThree(actual);
  if (!p[rankIndex]) return 0;
  return p[rankIndex] === a[rankIndex] ? max : 0;
}

export function topThreeSheetTotalPoints(pred, actual, finalized) {
  if (!finalized) return 0;
  return scoreTopThree(pred, actual).points;
}

export function knockoutMatchesFromList(matches) {
  return (matches ?? []).filter(isKnockoutMatch);
}
