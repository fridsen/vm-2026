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

function decidedKnockoutMatch(knockoutMatches, round) {
  return (knockoutMatches ?? []).find(
    (m) =>
      m.round === round &&
      m.status === 'finished' &&
      knockoutWinner(m),
  );
}

export function isFinalDecided(knockoutMatches) {
  return Boolean(decidedKnockoutMatch(knockoutMatches, 'FINAL'));
}

export function isBronzeDecided(knockoutMatches) {
  return Boolean(decidedKnockoutMatch(knockoutMatches, 'BRONZE'));
}

/** Full podium (gold + silver + bronze) is known. */
export function isPodiumFinalized(knockoutMatches) {
  return isFinalDecided(knockoutMatches) && isBronzeDecided(knockoutMatches);
}

/** Whether this podium slot can be scored (0=gold, 1=silver, 2=bronze). */
export function isPodiumSlotDecided(rankIndex, knockoutMatches) {
  if (rankIndex === 2) return isBronzeDecided(knockoutMatches);
  if (rankIndex === 0 || rankIndex === 1) return isFinalDecided(knockoutMatches);
  return false;
}

/**
 * Actual podium team ids. Unknown slots are null until that match is finished.
 * Order: [gold, silver, bronze].
 */
export function actualTopThreeTeamIds(knockoutMatches) {
  const finalMatch = decidedKnockoutMatch(knockoutMatches, 'FINAL');
  const bronzeMatch = decidedKnockoutMatch(knockoutMatches, 'BRONZE');
  return [
    finalMatch ? knockoutWinner(finalMatch) : null,
    finalMatch ? knockoutRunnerUp(finalMatch) : null,
    bronzeMatch ? knockoutWinner(bronzeMatch) : null,
  ];
}

export function topThreeRankPointsAtIndex(rankIndex, pred, actual, slotDecided) {
  const max = PODIUM_POINTS[rankIndex];
  if (max == null) return null;
  if (!slotDecided) return 0;
  const p = normalizeTopThree(pred);
  const a = normalizeTopThree(actual);
  if (!p[rankIndex] || !a[rankIndex]) return 0;
  return p[rankIndex] === a[rankIndex] ? max : 0;
}

/** Sum of points for slots that are already decided. */
export function topThreeSheetTotalPoints(pred, actual, knockoutMatches) {
  return [0, 1, 2].reduce((sum, rankIndex) => {
    const decided = isPodiumSlotDecided(rankIndex, knockoutMatches);
    return sum + (topThreeRankPointsAtIndex(rankIndex, pred, actual, decided) ?? 0);
  }, 0);
}

export function knockoutMatchesFromList(matches) {
  return (matches ?? []).filter(isKnockoutMatch);
}
