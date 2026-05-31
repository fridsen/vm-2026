// Låsregler för tippning.
//
// Globalt lås: När första gruppspelsmatchen sparkas igång låses allt
// som måste tippas "blind" (72 matcher, gruppslutställning, VM-vinnare,
// skytteliga).
//
// Slutspelet är progressivt:
// - R32 öppnar för tippning när sista gruppspelsomgången (rund 3) startar.
// - Varje följande rond öppnar när föregående rond är klar.
// - Varje rond låses vid avspark av rondens första match.

export const STATE = {
  NOT_AVAILABLE: 'not_available',
  OPEN: 'open',
  LOCKED: 'locked',
};

export function getGlobalDeadline(matches) {
  if (!matches || matches.length === 0) return null;
  return matches.reduce((earliest, m) => {
    if (!earliest) return m.kickoff;
    return m.kickoff < earliest ? m.kickoff : earliest;
  }, null);
}

export function isGroupPhaseLocked(now, matches) {
  const deadline = getGlobalDeadline(matches);
  if (!deadline) return false;
  return new Date(now) >= new Date(deadline);
}

// Status för en enskild gruppspelsmatch. I denna prototyp använder vi
// globalt lås för alla 72 matcher (enligt specen).
export function getMatchLockState(now, matches) {
  return isGroupPhaseLocked(now, matches) ? STATE.LOCKED : STATE.OPEN;
}

// Rondordningen.
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];

// Returnerar state för en slutspelsrond.
// groupMatches används för att veta när rund 3 i gruppspelet startar.
// knockoutMatches används för att hitta första kickoff i varje rond.
export function getKnockoutRoundState(round, now, groupMatches, knockoutMatches) {
  const nowDate = new Date(now);

  // Första kickoffen i denna rond
  const inRound = knockoutMatches.filter((m) => m.round === round);
  if (inRound.length === 0) return STATE.NOT_AVAILABLE;
  const firstKickoff = inRound.reduce(
    (e, m) => (!e || m.kickoff < e ? m.kickoff : e),
    null
  );

  // Om rondens första match har börjat → låst
  if (nowDate >= new Date(firstKickoff)) return STATE.LOCKED;

  // När öppnar ronden?
  if (round === 'R32') {
    // Öppnar när sista gruppspelsomgången (rund 3) börjar
    const round3First = groupMatches
      .filter((m) => m.round === 3)
      .reduce((e, m) => (!e || m.kickoff < e ? m.kickoff : e), null);
    if (!round3First) return STATE.NOT_AVAILABLE;
    return nowDate >= new Date(round3First) ? STATE.OPEN : STATE.NOT_AVAILABLE;
  }

  // För övriga ronder: öppnar när föregående rond är klar
  const prevIdx = ROUND_ORDER.indexOf(round) - 1;
  if (prevIdx < 0) return STATE.NOT_AVAILABLE;
  const prevRound = ROUND_ORDER[prevIdx];
  const prevMatches = knockoutMatches.filter((m) => m.round === prevRound);
  if (prevMatches.length === 0) return STATE.NOT_AVAILABLE;

  const allPrevDone = prevMatches.every((m) => m.result != null);
  // Proxy när mock-data saknar resultat: öppna när föregående ronds sista
  // kickoff har passerat (ungefärligt "ronden är klar").
  const prevLastKickoff = prevMatches.reduce(
    (latest, m) => (!latest || m.kickoff > latest ? m.kickoff : latest),
    null
  );
  const prevRoundDone =
    allPrevDone || (prevLastKickoff && nowDate >= new Date(prevLastKickoff));

  return prevRoundDone ? STATE.OPEN : STATE.NOT_AVAILABLE;
}

// Antal ms kvar till en given deadline (negativt om passerat).
export function msUntil(deadline, now = Date.now()) {
  if (!deadline) return null;
  return new Date(deadline).getTime() - new Date(now).getTime();
}

// Hjälpare för countdown-UI.
export function formatCountdown(ms) {
  if (ms == null) return '–';
  if (ms <= 0) return 'Låst';
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}
