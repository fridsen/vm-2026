// Rena poängfunktioner - lätta att enhetstesta.
// Varje funktion returnerar { points, breakdown } där breakdown beskriver
// vilka delpoäng som gavs (för UI-transparens).

import { signFromScore } from './signFromScore.js';

// ============================================================
// Gruppspelsmatch: max 5p
// - Rätt tecken (1/X/2): 2p
// - Rätt antal hemmamål: 1p
// - Rätt antal bortamål: 1p
// - Bonus om allt stämmer (tecken + båda mål): +1p
// ============================================================
export function scoreGroupMatch(pred, actual) {
  const breakdown = { sign: 0, homeGoals: 0, awayGoals: 0, exact: 0 };
  if (!pred || !actual) return { points: 0, breakdown };
  if (pred.home == null || pred.away == null) return { points: 0, breakdown };
  if (actual.home == null || actual.away == null) return { points: 0, breakdown };

  // Sign is the user's explicit 1/X/2 pick when set; otherwise derived
  // from the predicted score for backward-compatibility.
  const predSign =
    pred.outcome === '1' || pred.outcome === 'X' || pred.outcome === '2'
      ? pred.outcome
      : signFromScore(pred.home, pred.away);
  const actualSign = signFromScore(actual.home, actual.away);
  const signCorrect = predSign !== null && predSign === actualSign;
  const homeCorrect = Number(pred.home) === Number(actual.home);
  const awayCorrect = Number(pred.away) === Number(actual.away);

  if (signCorrect) breakdown.sign = 2;
  if (homeCorrect) breakdown.homeGoals = 1;
  if (awayCorrect) breakdown.awayGoals = 1;
  if (signCorrect && homeCorrect && awayCorrect) breakdown.exact = 1;

  const points =
    breakdown.sign + breakdown.homeGoals + breakdown.awayGoals + breakdown.exact;
  return { points, breakdown };
}

// ============================================================
// Gruppslutställning: max 6p
// - Rätt gruppvinnare: 2p
// - Rätt tvåa: 1p
// - Rätt trea: 1p
// - Bonus om alla fyra rätt i rätt ordning: +2p
// ============================================================
export function scoreGroupStanding(pred, actual) {
  const breakdown = { first: 0, second: 0, third: 0, allFourBonus: 0 };
  if (!pred || !actual || pred.length < 4 || actual.length < 4) {
    return { points: 0, breakdown };
  }

  if (pred[0] && pred[0] === actual[0]) breakdown.first = 2;
  if (pred[1] && pred[1] === actual[1]) breakdown.second = 1;
  if (pred[2] && pred[2] === actual[2]) breakdown.third = 1;

  const allFour =
    pred[0] === actual[0] &&
    pred[1] === actual[1] &&
    pred[2] === actual[2] &&
    pred[3] === actual[3];
  if (allFour) breakdown.allFourBonus = 2;

  const points =
    breakdown.first + breakdown.second + breakdown.third + breakdown.allFourBonus;
  return { points, breakdown };
}

// ============================================================
// Slutspel - lag som går vidare per rond.
// R32 (sextondelsfinal, 32→16): 2p per korrekt lag vidare (max 32p)
// R16 (åttondelsfinal,  16→8):  3p per korrekt lag vidare (max 24p)
// QF  (kvartsfinal,      8→4):  3p per korrekt lag vidare (max 12p)
// SF  (semifinal,        4→2):  4p per korrekt lag vidare (max 8p)
// Bronsmatch: rätt vinnare = 5p
// Final: rätt finalist = 5p per lag (max 10p)
// VM-vinnare: 15p
// ============================================================
const ADVANCE_POINTS = {
  R32: 2,
  R16: 3,
  QF: 3,
  SF: 4,
};

export function scoreKnockoutAdvance(round, predTeams, actualTeams) {
  const perTeam = ADVANCE_POINTS[round];
  if (!perTeam) {
    return { points: 0, breakdown: { correctCount: 0, perTeam: 0 } };
  }
  const predSet = new Set((predTeams || []).filter(Boolean));
  const actualSet = new Set((actualTeams || []).filter(Boolean));
  let correct = 0;
  predSet.forEach((t) => {
    if (actualSet.has(t)) correct += 1;
  });
  return {
    points: correct * perTeam,
    breakdown: { correctCount: correct, perTeam, round },
  };
}

export function scoreBronzeWinner(predTeamId, actualTeamId) {
  const correct = predTeamId && predTeamId === actualTeamId;
  return {
    points: correct ? 5 : 0,
    breakdown: { correct: !!correct },
  };
}

export function scoreFinalists(predTeamIds, actualTeamIds) {
  const predSet = new Set((predTeamIds || []).filter(Boolean));
  const actualSet = new Set((actualTeamIds || []).filter(Boolean));
  let correct = 0;
  predSet.forEach((t) => {
    if (actualSet.has(t)) correct += 1;
  });
  return {
    points: correct * 5,
    breakdown: { correctCount: correct, perTeam: 5 },
  };
}

export function scoreWorldCupWinner(predTeamId, actualTeamId) {
  const correct = predTeamId && predTeamId === actualTeamId;
  return {
    points: correct ? 15 : 0,
    breakdown: { correct: !!correct },
  };
}

// ============================================================
// Skytteliga: max 25p (10 + 6 + 3 + 6)
// - Rätt skyttekung:    10p
// - Rätt tvåa:           6p
// - Rätt trea:           3p
// - Bonus alla tre rätt (valfri ordning): +3p
// - Bonus alla tre rätt (rätt ordning):   +6p (ersätter +3-bonusen)
// ============================================================
export function scoreTopScorers(pred, actual) {
  const breakdown = {
    first: 0,
    second: 0,
    third: 0,
    allThreeBonus: 0,
    exactOrderBonus: 0,
  };
  if (!pred || !actual || pred.length < 3 || actual.length < 3) {
    return { points: 0, breakdown };
  }

  if (pred[0] && pred[0] === actual[0]) breakdown.first = 10;
  if (pred[1] && pred[1] === actual[1]) breakdown.second = 6;
  if (pred[2] && pred[2] === actual[2]) breakdown.third = 3;

  const predSet = new Set(pred.slice(0, 3).filter(Boolean));
  const actualSet = new Set(actual.slice(0, 3).filter(Boolean));
  const allThree =
    predSet.size === 3 && [...predSet].every((p) => actualSet.has(p));
  const exactOrder =
    pred[0] === actual[0] && pred[1] === actual[1] && pred[2] === actual[2];

  if (exactOrder) {
    breakdown.exactOrderBonus = 6;
  } else if (allThree) {
    breakdown.allThreeBonus = 3;
  }

  const points =
    breakdown.first +
    breakdown.second +
    breakdown.third +
    breakdown.allThreeBonus +
    breakdown.exactOrderBonus;
  return { points, breakdown };
}

// ============================================================
// Sammanlagd summering av alla kategorier för en användare.
// ============================================================
export function summarizePoints({
  groupMatches = [],
  groupStandings = [],
  knockout = null,
  topScorers = null,
} = {}) {
  const matchPoints = groupMatches.reduce((sum, r) => sum + (r?.points || 0), 0);
  const groupPoints = groupStandings.reduce((sum, r) => sum + (r?.points || 0), 0);
  let knockoutPoints = 0;
  if (knockout) {
    knockoutPoints =
      (knockout.R32?.points || 0) +
      (knockout.R16?.points || 0) +
      (knockout.QF?.points || 0) +
      (knockout.SF?.points || 0) +
      (knockout.BRONZE?.points || 0) +
      (knockout.FINAL?.points || 0) +
      (knockout.WINNER?.points || 0);
  }
  const topScorerPoints = topScorers?.points || 0;
  return {
    matchPoints,
    groupPoints,
    knockoutPoints,
    topScorerPoints,
    total: matchPoints + groupPoints + knockoutPoints + topScorerPoints,
  };
}
