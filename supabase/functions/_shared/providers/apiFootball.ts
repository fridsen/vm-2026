// api-football.com adapter (RapidAPI or direct).
//
// Free tier: 100 req/day. World Cup league id is 1 (api-football's own id).
// We hit the v3 base URL directly using the Pro plan key model — if the user
// is on RapidAPI the same code works by passing `RAPIDAPI_KEY` and flipping
// the `host` to "api-football-v1.p.rapidapi.com".
//
// Endpoints:
//   GET /v3/teams?league=1&season=2026
//   GET /v3/fixtures?league=1&season=2026
//   GET /v3/players/topscorers?league=1&season=2026

import type {
  FootballProvider,
  ProviderFixture,
  ProviderTeam,
  ProviderTopScorer,
} from './types.ts';

const LEAGUE = 1;
const SEASON = 2026;

function knockoutFromRound(
  round: string,
):
  | 'R32'
  | 'R16'
  | 'QF'
  | 'SF'
  | 'BRONZE'
  | 'FINAL'
  | null {
  // api-football labels rounds with descriptive English strings such as
  // "Round of 32", "Quarter-finals", "3rd Place Final", etc. Match
  // case-insensitively against the patterns we know.
  const r = round.toLowerCase();
  if (r.includes('round of 32') || r.includes('1/16')) return 'R32';
  if (r.includes('round of 16') || r.includes('1/8')) return 'R16';
  if (r.includes('quarter')) return 'QF';
  if (r.includes('semi')) return 'SF';
  if (
    r.includes('3rd place') ||
    r.includes('third place') ||
    r.includes('bronze')
  )
    return 'BRONZE';
  if (r === 'final' || r.endsWith(' final')) return 'FINAL';
  return null;
}

function groupFromRound(round: string): { group: string; matchday: number } | null {
  // "Group Stage - 1" / "Group A - 1" patterns.
  const stage = /Group Stage - (\d+)/i.exec(round);
  if (stage) return { group: 'A', matchday: Number(stage[1]) }; // group derived elsewhere
  const named = /Group ([A-L]) - (\d+)/i.exec(round);
  if (named) return { group: named[1].toUpperCase(), matchday: Number(named[2]) };
  return null;
}

function statusFromShort(s: string): ProviderFixture['status'] {
  switch (s) {
    case 'NS':
    case 'TBD':
      return 'scheduled';
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

export class ApiFootballProvider implements FootballProvider {
  readonly name = 'api-football';
  private apiKey: string;
  private host: string;
  private base: string;

  constructor(apiKey: string, host = 'v3.football.api-sports.io') {
    if (!apiKey) {
      throw new Error('API_FOOTBALL_KEY is required');
    }
    this.apiKey = apiKey;
    this.host = host;
    this.base = `https://${host}`;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': this.host,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `api-football ${res.status} ${path}: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }

  async fetchTeams(): Promise<ProviderTeam[]> {
    type Resp = {
      response: Array<{
        team: { id: number; name: string; code: string | null };
      }>;
    };
    const json = await this.get<Resp>(
      `/teams?league=${LEAGUE}&season=${SEASON}`,
    );
    return json.response.map((r) => ({
      externalId: String(r.team.id),
      name: r.team.name,
      shortCode: r.team.code ?? null,
      group: null,
    }));
  }

  async fetchFixtures(): Promise<ProviderFixture[]> {
    type Resp = {
      response: Array<{
        fixture: {
          id: number;
          date: string;
          status: { short: string };
        };
        league: { round: string };
        teams: {
          home: { id: number | null };
          away: { id: number | null };
        };
        goals: { home: number | null; away: number | null };
      }>;
    };
    const json = await this.get<Resp>(
      `/fixtures?league=${LEAGUE}&season=${SEASON}`,
    );

    return json.response.map((f): ProviderFixture => {
      const round = f.league.round;
      const knockout = knockoutFromRound(round);
      const group = groupFromRound(round);
      const isGroup = !knockout && !!group;

      return {
        externalId: String(f.fixture.id),
        stage: isGroup ? 'group' : 'knockout',
        group: isGroup ? group?.group : undefined,
        groupRound: isGroup ? group?.matchday : undefined,
        knockoutRound: knockout ?? undefined,
        kickoff: f.fixture.date,
        homeTeamExternalId:
          f.teams.home?.id != null ? String(f.teams.home.id) : null,
        awayTeamExternalId:
          f.teams.away?.id != null ? String(f.teams.away.id) : null,
        homeScore: f.goals?.home ?? null,
        awayScore: f.goals?.away ?? null,
        status: statusFromShort(f.fixture.status.short),
      };
    });
  }

  async fetchTopScorers(): Promise<ProviderTopScorer[]> {
    type Resp = {
      response: Array<{
        player: { id: number; name: string };
        statistics: Array<{
          team: { id: number | null };
          goals: { total: number | null; assists: number | null };
        }>;
      }>;
    };
    const json = await this.get<Resp>(
      `/players/topscorers?league=${LEAGUE}&season=${SEASON}`,
    );
    return json.response.map((p, i) => {
      const stat = p.statistics?.[0];
      return {
        playerExternalId: String(p.player.id),
        playerName: p.player.name,
        teamExternalId: stat?.team?.id != null ? String(stat.team.id) : null,
        goals: stat?.goals?.total ?? 0,
        assists: stat?.goals?.assists ?? 0,
        position: i + 1,
      };
    });
  }
}
