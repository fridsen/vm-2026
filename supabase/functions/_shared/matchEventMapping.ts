// Maps api-football fixture events → match_events rows.

export type RevealEventType = 'goal' | 'yellow' | 'red' | 'injury';

export type MappedMatchEvent = {
  minute: number;
  type: RevealEventType;
  team_side: 'home' | 'away';
  player_name: string | null;
  detail: string;
  sort_order: number;
};

export type ApiFootballEvent = {
  time: { elapsed: number | null; extra?: number | null };
  team: { id: number; name?: string };
  player?: { name?: string } | null;
  type: string;
  detail?: string | null;
  comments?: string | null;
};

function teamSide(
  teamExternalId: string,
  homeExternalId: string | null,
  awayExternalId: string | null,
): 'home' | 'away' | null {
  if (homeExternalId && teamExternalId === homeExternalId) return 'home';
  if (awayExternalId && teamExternalId === awayExternalId) return 'away';
  return null;
}

function isInjurySubst(detail: string, comments: string | null): boolean {
  const text = `${detail} ${comments ?? ''}`.toLowerCase();
  return (
    text.includes('injury') ||
    text.includes('skada') ||
    text.includes('hurt') ||
    text.includes('medical')
  );
}

function eventMinute(ev: ApiFootballEvent): number {
  const elapsed = ev.time.elapsed ?? 0;
  const extra = ev.time.extra ?? 0;
  return elapsed + extra;
}

/** api-football lists missed/disallowed goals under type Goal — exclude from tally. */
export function isScoringGoalDetail(detail: string): boolean {
  const d = detail.toLowerCase();
  if (!d) return true;
  if (d.includes('missed penalty')) return false;
  if (d.includes('cancelled') || d.includes('disallowed')) return false;
  return true;
}

export function reconcileMappedGoalEvents(
  rows: MappedMatchEvent[],
  homeScore: number,
  awayScore: number,
): MappedMatchEvent[] {
  let homeGoals = 0;
  let awayGoals = 0;
  let sortOrder = 0;
  const out: MappedMatchEvent[] = [];

  for (const row of rows) {
    if (row.type !== 'goal') {
      out.push({ ...row, sort_order: sortOrder++ });
      continue;
    }

    const nextHome = row.team_side === 'home' ? homeGoals + 1 : homeGoals;
    const nextAway = row.team_side === 'away' ? awayGoals + 1 : awayGoals;
    if (nextHome > homeScore || nextAway > awayScore) continue;

    homeGoals = nextHome;
    awayGoals = nextAway;
    out.push({
      ...row,
      detail: `${homeGoals}–${awayGoals}`,
      sort_order: sortOrder++,
    });
  }

  return out;
}

export function mapApiFootballEvents(
  events: ApiFootballEvent[],
  homeExternalId: string | null,
  awayExternalId: string | null,
): MappedMatchEvent[] {
  const rows: MappedMatchEvent[] = [];
  let homeGoals = 0;
  let awayGoals = 0;
  let sortOrder = 0;

  const sorted = [...events].sort((a, b) => eventMinute(a) - eventMinute(b));

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
        team_side: side,
        player_name: playerName,
        detail: `${homeGoals}–${awayGoals}`,
        sort_order: sortOrder++,
      });
      continue;
    }

    if (type === 'Card') {
      const isRed = detail.toLowerCase().includes('red');
      rows.push({
        minute,
        type: isRed ? 'red' : 'yellow',
        team_side: side,
        player_name: playerName,
        detail: isRed ? 'Rött kort' : 'Gult kort',
        sort_order: sortOrder++,
      });
      continue;
    }

    if (type === 'subst' && isInjurySubst(detail, comments)) {
      rows.push({
        minute,
        type: 'injury',
        team_side: side,
        player_name: playerName,
        detail: 'Bytt ut – skada',
        sort_order: sortOrder++,
      });
    }
  }

  return rows;
}
