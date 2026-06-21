// Maps api-football fixture events → reveal event rows (mirrors Deno matchEventMapping.ts).

/**
 * @typedef {'goal' | 'yellow' | 'red' | 'injury'} RevealEventType
 * @typedef {{ minute: number, type: RevealEventType, team: 'home' | 'away', player: string | null, detail: string }} RevealEvent
 */

function teamSide(teamExternalId, homeExternalId, awayExternalId) {
  if (homeExternalId && teamExternalId === homeExternalId) return 'home';
  if (awayExternalId && teamExternalId === awayExternalId) return 'away';
  return null;
}

function isInjurySubst(detail, comments) {
  const text = `${detail} ${comments ?? ''}`.toLowerCase();
  return (
    text.includes('injury') ||
    text.includes('skada') ||
    text.includes('hurt') ||
    text.includes('medical')
  );
}

function eventMinute(ev) {
  const elapsed = ev.time?.elapsed ?? 0;
  const extra = ev.time?.extra ?? 0;
  return elapsed + extra;
}

/** api-football lists missed/disallowed goals under type Goal — exclude from tally. */
export function isScoringGoalDetail(detail) {
  const d = (detail ?? '').toLowerCase();
  if (!d) return true;
  if (d.includes('missed penalty')) return false;
  if (d.includes('cancelled') || d.includes('disallowed')) return false;
  return true;
}

/** Drop phantom goals so the ticker matches the official FT score. */
export function reconcileRevealEvents(events, homeScore, awayScore) {
  let homeGoals = 0;
  let awayGoals = 0;
  const out = [];

  for (const ev of events ?? []) {
    if (ev.type !== 'goal') {
      out.push(ev);
      continue;
    }

    const nextHome = ev.team === 'home' ? homeGoals + 1 : homeGoals;
    const nextAway = ev.team === 'away' ? awayGoals + 1 : awayGoals;
    if (nextHome > homeScore || nextAway > awayScore) continue;

    homeGoals = nextHome;
    awayGoals = nextAway;
    out.push({ ...ev, detail: `${homeGoals}–${awayGoals}` });
  }

  return out;
}

/**
 * @param {Array<{ time: object, team: { id: number }, player?: { name?: string }, type: string, detail?: string, comments?: string }>} events
 * @param {string | null} homeExternalId
 * @param {string | null} awayExternalId
 * @returns {RevealEvent[]}
 */
export function mapApiFootballEvents(events, homeExternalId, awayExternalId) {
  const rows = [];
  let homeGoals = 0;
  let awayGoals = 0;

  const sorted = [...(events ?? [])].sort((a, b) => eventMinute(a) - eventMinute(b));

  for (const ev of sorted) {
    const minute = eventMinute(ev);
    const side = teamSide(String(ev.team.id), homeExternalId, awayExternalId);
    if (!side) continue;

    const playerName = ev.player?.name?.trim() || null;
    const detail = (ev.detail ?? '').trim();
    const comments = ev.comments?.trim() ?? null;
    const type = ev.type?.trim() ?? '';

    if (type === 'Goal') {
      if (!isScoringGoalDetail(detail)) continue;
      if (side === 'home') homeGoals += 1;
      else awayGoals += 1;
      rows.push({
        minute,
        type: 'goal',
        team: side,
        player: playerName,
        detail: `${homeGoals}–${awayGoals}`,
      });
      continue;
    }

    if (type === 'Card') {
      const isRed = detail.toLowerCase().includes('red');
      rows.push({
        minute,
        type: isRed ? 'red' : 'yellow',
        team: side,
        player: playerName,
        detail: isRed ? 'Rött kort' : 'Gult kort',
      });
      continue;
    }

    if (type === 'subst' && isInjurySubst(detail, comments)) {
      rows.push({
        minute,
        type: 'injury',
        team: side,
        player: playerName,
        detail: 'Bytt ut – skada',
      });
    }
  }

  return rows;
}

/**
 * @param {{ minute: number, type: string, team_side: string, player_name: string | null, detail: string }} row
 * @returns {RevealEvent}
 */
export function rowToRevealEvent(row) {
  return {
    minute: row.minute,
    type: row.type,
    team: row.team_side,
    player: row.player_name ?? null,
    detail: row.detail,
  };
}
