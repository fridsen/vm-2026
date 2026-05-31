// Match analysis — produces a multi-sentence Swedish breakdown of a matchup
// from the 1X2 probabilities (whether real bookmaker-derived or our mock).
//
// `mockProbabilities(home, away)` is a deterministic fallback used when no
// live odds are available. `pickFromProbs(probs)` returns the most-likely
// outcome. `buildAnalysis(home, away, probs)` composes a four-part analysis
// (favorite framing → gap commentary → underdog dynamic → closing
// recommendation) — each part drawn deterministically from a template pool
// so the same matchup always reads identically across renders.

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function teamSeed(home, away) {
  return hash(`${home?.id || ''}:${away?.id || ''}`);
}

function pickFromList(list, seed, salt = 0) {
  if (!list?.length) return '';
  return list[(seed + salt) % list.length];
}

export function mockProbabilities(home, away) {
  if (!home || !away) return null;
  const seed = teamSeed(home, away);
  let homeWin = 38 + (seed % 25);
  let draw = 18 + ((seed >> 5) % 12);
  let awayWin = 100 - homeWin - draw;
  if (awayWin < 10) {
    const fix = 10 - awayWin;
    homeWin -= fix;
    awayWin = 10;
  }
  return { homeWin, draw, awayWin };
}

export function pickFromProbs(probs) {
  if (!probs) return null;
  const { homeWin, draw, awayWin } = probs;
  if (homeWin >= draw && homeWin >= awayWin) return 'home';
  if (awayWin >= homeWin && awayWin >= draw) return 'away';
  return 'draw';
}

/**
 * Compose a multi-sentence Swedish analysis of a matchup from the probability
 * split. Sections:
 *  1. Favorite framing — who's in front and why
 *  2. Gap commentary  — how decisive the lean is
 *  3. Underdog dynamic — how the trailing side might respond
 *  4. Closing call    — explicit recommendation
 *
 * Returns "" when inputs are incomplete.
 */
export function buildAnalysis(home, away, probs) {
  if (!home || !away || !probs) return '';
  const seed = teamSeed(home, away);
  const pick = pickFromProbs(probs);
  const sortedTop = Math.max(probs.homeWin, probs.draw, probs.awayWin);
  const sortedSecond = [probs.homeWin, probs.draw, probs.awayWin]
    .sort((a, b) => b - a)[1];
  const gap = sortedTop - sortedSecond;

  const fav = pick === 'home' ? home : pick === 'away' ? away : null;
  const dog = pick === 'home' ? away : pick === 'away' ? home : null;

  // Section 1 — favorite framing
  let opening;
  if (!fav) {
    // It's a draw pick — frame as evenly matched.
    opening = pickFromList(
      [
        `Modellen ser detta som en jämn match där varken ${home.name} eller ${away.name} har ett tydligt övertag.`,
        `${home.name} och ${away.name} skiljs åt med marginal — en match som kan svänga åt vilket håll som helst.`,
        `På pappret är detta så jämnt det kan bli; båda lagen har skäl att tro på poäng.`,
      ],
      seed,
    );
  } else {
    opening = pickFromList(
      [
        `${fav.name} går in som favoriter och har det starkare laget på pappret.`,
        `${fav.name} har högre snitt-form senaste perioden och ses som favoriter i denna duell.`,
        `Modellen lutar tydligt mot ${fav.name} — bredare trupp, bättre individuell kvalitet och högre nivå senaste matcherna.`,
      ],
      seed,
    );
  }

  // Section 2 — gap commentary
  let gapLine;
  if (!fav) {
    gapLine = pickFromList(
      [
        `Sannolikheten för oavgjort är hög och varje fel kan avgöra matchen.`,
        `Med så små marginaler blir detaljerna avgörande — fasta situationer och individuella misstag väger extra tungt.`,
      ],
      seed,
      1,
    );
  } else if (gap >= 20) {
    gapLine = pickFromList(
      [
        `Övertaget är markant — modellen sätter dem som klar etta i denna duell.`,
        `Skillnaden mellan lagen är tydlig och det skulle krävas en överraskning för att vända matchen.`,
        `Det här är en av matcherna där modellen är som mest övertygad om utfallet.`,
      ],
      seed,
      1,
    );
  } else if (gap >= 10) {
    gapLine = pickFromList(
      [
        `Övertaget är dock inte stort — varje misstag kan jämna ut matchen snabbt.`,
        `Favorit-stämpeln håller men marginalerna är inte överväldigande.`,
        `Det finns en tydlig favorit, men inte så stor att underdogen ska räknas bort.`,
      ],
      seed,
      1,
    );
  } else {
    gapLine = pickFromList(
      [
        `Skillnaden mellan lagen är minimal — det här blir avgjort i detaljerna.`,
        `På siffrorna är det nästan en kasta-slant-match; en chans hit eller dit avgör.`,
      ],
      seed,
      1,
    );
  }

  // Section 3 — underdog dynamic
  let dogLine;
  if (dog) {
    dogLine = pickFromList(
      [
        `${dog.name} kommer att förlita sig på defensiv organisation och effektiva kontringar för att hänga med.`,
        `${dog.name} har historiskt visat att de kan ställa till problem för större lag på en bra dag.`,
        `${dog.name} behöver vara kliniska i sina få chanser för att utnyttja en lucka i denna match.`,
        `${dog.name} har inget att förlora och kan spela med högre risk — något som tidigare gett dem oväntade resultat.`,
      ],
      seed,
      2,
    );
  } else {
    dogLine = pickFromList(
      [
        `Båda lagen lär gå in defensivt stabila och hoppas på en lucka i andra halvlek.`,
        `Lagen kommer sannolikt vara försiktiga inledningsvis innan matchen öppnar upp.`,
      ],
      seed,
      2,
    );
  }

  // Section 4 — closing call
  const recText =
    pick === 'home'
      ? `${home.name}-vinst`
      : pick === 'away'
        ? `${away.name}-vinst`
        : 'Oavgjort';
  const closing = pickFromList(
    [
      `Vår rekommendation: ${recText}.`,
      `Modellens slutsats lutar mot ${recText.toLowerCase()}.`,
      `Tipset: ${recText}.`,
    ],
    seed,
    3,
  );

  return `${opening} ${gapLine} ${dogLine} ${closing}`;
}

export function aiAnalysis(home, away) {
  const probs = mockProbabilities(home, away);
  if (!probs) return null;
  const pick = pickFromProbs(probs);
  return { ...probs, pick, blurb: buildAnalysis(home, away, probs) };
}
