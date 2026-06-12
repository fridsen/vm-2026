// Live score supplement via api-football (api-sports.io).
// football-data.org often stays TIMED with null scores during WC matches;
// api-football /fixtures?live=all returns real-time goals for the same games.
// When a match ends it drops off live=all — today's fixtures endpoint catches FT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;
const BASE = 'https://v3.football.api-sports.io';

type ApiFixture = {
  fixture: {
    date: string;
    status: { short: string; elapsed: number | null };
  };
  league: { id: number; season: number };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: { home: number | null; away: number | null };
};

type DbMatchRow = {
  id: string;
  kickoff: string;
  home_team_id: string;
  away_team_id: string;
};

function statusFromShort(s: string): string {
  switch (s) {
    case '1H':
    case '2H':
    case 'HT':
    case 'ET':
    case 'P':
    case 'BT':
    case 'LIVE':
      return 'in_play';
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'finished';
    case 'PST':
      return 'postponed';
    case 'CANC':
    case 'ABD':
    case 'AWD':
    case 'WO':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/** Collapse provider/DB variants onto one key for fuzzy team pairing. */
function canonicalTeamName(name: string): string {
  const n = normalizeName(name);
  if (!n) return n;
  if (n === 'sydkorea' || (n.includes('korea') && !n.includes('north'))) {
    return 'south korea';
  }
  if (n === 'tjeckien' || n.startsWith('czech')) return 'czechia';
  if (n === 'sydafrika' || n === 'south africa') return 'south africa';
  if (n === 'bosnia' || n.includes('bosnia')) return 'bosnia';
  if (n === 'usa' || n === 'united states') return 'usa';
  return n;
}

/** api-football "Korea Republic" vs DB "South Korea", "Czech Republic" vs "Czechia", etc. */
function namesMatch(a: string, b: string): boolean {
  const ca = canonicalTeamName(a);
  const cb = canonicalTeamName(b);
  if (ca === cb) return true;
  if (ca.startsWith(cb) || cb.startsWith(ca)) return true;
  const aFirst = ca.split(/\s+/)[0];
  const bFirst = cb.split(/\s+/)[0];
  return aFirst.length >= 4 && aFirst === bFirst;
}

function liveMinuteFromFixture(statusShort: string, elapsed: number | null): number | null {
  if (statusShort === 'HT') return 45;
  if (elapsed != null && elapsed >= 0) return elapsed;
  return null;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchApiFootball(
  apiKey: string,
  path: string,
): Promise<ApiFixture[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`api-football ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { response?: ApiFixture[] };
  return (json.response ?? []).filter(
    (f) => f.league.id === WC_LEAGUE_ID && f.league.season === WC_SEASON,
  );
}

async function loadTodayMatchContext(supabase: ReturnType<typeof createClient>) {
  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name');
  if (teamsErr) throw new Error(`teams load: ${teamsErr.message}`);

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id, kickoff, home_team_id, away_team_id')
    .gte('kickoff', dayStart.toISOString())
    .lt('kickoff', dayEnd.toISOString());
  if (matchErr) throw new Error(`matches load: ${matchErr.message}`);

  return { teamNameById, matches: (matches ?? []) as DbMatchRow[] };
}

function findDbMatch(
  matches: DbMatchRow[],
  teamNameById: Map<string, string>,
  fixture: ApiFixture,
): DbMatchRow | undefined {
  const kickoffMs = new Date(fixture.fixture.date).getTime();
  return matches.find((m) => {
    const home = teamNameById.get(m.home_team_id);
    const away = teamNameById.get(m.away_team_id);
    if (!home || !away) return false;
    if (!namesMatch(home, fixture.teams.home.name)) return false;
    if (!namesMatch(away, fixture.teams.away.name)) return false;
    const delta = Math.abs(new Date(m.kickoff).getTime() - kickoffMs);
    return delta < 3 * 60 * 60 * 1000;
  });
}

async function applyFixtureToMatch(
  supabase: ReturnType<typeof createClient>,
  rowId: string,
  fixture: ApiFixture,
): Promise<boolean> {
  if (fixture.goals.home == null || fixture.goals.away == null) return false;

  const status = statusFromShort(fixture.fixture.status.short);
  const liveMinute = status === 'finished'
    ? null
    : liveMinuteFromFixture(
      fixture.fixture.status.short,
      fixture.fixture.status.elapsed,
    );

  const { data, error } = await supabase
    .from('matches')
    .update({
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      status,
      live_minute: liveMinute,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rowId)
    .select('id');
  if (error) throw new Error(`matches update: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

async function upsertFixtures(
  supabase: ReturnType<typeof createClient>,
  fixtures: ApiFixture[],
): Promise<number> {
  if (fixtures.length === 0) return 0;

  const { teamNameById, matches } = await loadTodayMatchContext(supabase);
  let updated = 0;
  for (const f of fixtures) {
    const row = findDbMatch(matches, teamNameById, f);
    if (!row) continue;
    if (await applyFixtureToMatch(supabase, row.id, f)) updated += 1;
  }
  return updated;
}

export async function upsertApiFootballLiveScores(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
): Promise<number> {
  const live = await fetchApiFootball(apiKey, '/fixtures?live=all');
  return upsertFixtures(supabase, live);
}

/** Catches full-time results after a match leaves the live feed. */
export async function upsertApiFootballTodayFixtures(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
): Promise<number> {
  const today = utcToday();
  const fixtures = await fetchApiFootball(
    apiKey,
    `/fixtures?date=${today}&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
  );
  return upsertFixtures(supabase, fixtures);
}
