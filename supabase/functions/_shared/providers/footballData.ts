// football-data.org adapter.
//
// Free tier: 10 req/min, 10 different competitions. The World Cup competition
// is `WC` (id 2000). Endpoints used:
//   GET /v4/competitions/WC/teams
//   GET /v4/competitions/WC/matches
//   GET /v4/competitions/WC/scorers
//   GET /v4/matches?competitions=WC&dateFrom=…&dateTo=…   (live / today sync)
//
// Returns 403 with descriptive json when the WC competition is not unlocked
// for the API key. We surface that as a thrown error so the sync function
// logs a clear message instead of writing an empty payload.

import type {
  FootballProvider,
  ProviderFixture,
  ProviderTeam,
  ProviderTopScorer,
} from './types.ts';

const BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: { id: number | null };
  awayTeam: { id: number | null };
  score?: {
    fullTime?: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
    regularTime?: { home: number | null; away: number | null };
  };
};

type MatchesResp = { matches: ApiMatch[] };

// Group letter is included in the matches endpoint as a `group` string like
// "GROUP_A". We strip the prefix before comparing.
function letterFromGroup(g: string | null | undefined): string | null {
  if (!g) return null;
  const m = /GROUP_([A-L])/i.exec(g);
  return m ? m[1].toUpperCase() : null;
}

// Map their `stage` enum onto our knockout round codes. football-data.org
// uses GROUP_STAGE / LAST_16 / QUARTER_FINALS / SEMI_FINALS / THIRD_PLACE /
// FINAL — and historically has not included a Last-32 stage because pre-2026
// world cups had 32 teams. WC 2026 has 48 teams, so the Last-32 round may
// land under a stage name like LAST_32 once the data is published. We map
// both possibilities defensively.
function knockoutFromStage(
  stage: string,
):
  | 'R32'
  | 'R16'
  | 'QF'
  | 'SF'
  | 'BRONZE'
  | 'FINAL'
  | null {
  switch (stage) {
    case 'LAST_32':
    case 'ROUND_OF_32':
      return 'R32';
    case 'LAST_16':
    case 'ROUND_OF_16':
      return 'R16';
    case 'QUARTER_FINALS':
      return 'QF';
    case 'SEMI_FINALS':
      return 'SF';
    case 'THIRD_PLACE':
    case 'PLAY_OFF_FOR_THIRD_PLACE':
      return 'BRONZE';
    case 'FINAL':
      return 'FINAL';
    default:
      return null;
  }
}

function statusFromApi(s: string): ProviderFixture['status'] {
  switch (s) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'in_play';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'POSTPONED':
    case 'SUSPENDED':
      return 'postponed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      // SCHEDULED, TIMED, and anything unknown → scheduled
      return 'scheduled';
  }
}

/** Best available score from football-data.org (live scores land in fullTime). */
function scoresFromApi(
  score: ApiMatch['score'],
): { homeScore: number | null; awayScore: number | null } {
  const parts = [
    score?.fullTime,
    score?.regularTime,
    score?.halfTime,
  ];
  for (const part of parts) {
    if (part?.home != null && part?.away != null) {
      return { homeScore: part.home, awayScore: part.away };
    }
  }
  return { homeScore: null, awayScore: null };
}

function mapMatch(m: ApiMatch): ProviderFixture {
  const isGroup = m.stage === 'GROUP_STAGE';
  const knockout = isGroup ? null : knockoutFromStage(m.stage);
  const { homeScore, awayScore } = scoresFromApi(m.score);

  return {
    externalId: String(m.id),
    stage: isGroup ? 'group' : 'knockout',
    group: isGroup ? letterFromGroup(m.group) ?? undefined : undefined,
    groupRound: isGroup ? m.matchday ?? undefined : undefined,
    knockoutRound: knockout ?? undefined,
    kickoff: m.utcDate,
    homeTeamExternalId:
      m.homeTeam?.id != null ? String(m.homeTeam.id) : null,
    awayTeamExternalId:
      m.awayTeam?.id != null ? String(m.awayTeam.id) : null,
    homeScore,
    awayScore,
    status: statusFromApi(m.status),
  };
}

/** How far back to reconcile finished scores after auto-finalize / UTC day rollover. */
const RECENT_FINISHED_MS = 48 * 60 * 60 * 1000;

function isRecentKickoff(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime();
  return !Number.isNaN(kickoff) && now - kickoff <= RECENT_FINISHED_MS;
}

function isLiveOrScoredMatch(m: ApiMatch): boolean {
  return (
    m.status === 'IN_PLAY' ||
    m.status === 'PAUSED' ||
    m.status === 'FINISHED' ||
    scoresFromApi(m.score).homeScore != null
  );
}

export class FootballDataProvider implements FootballProvider {
  readonly name = 'football-data.org';
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'X-Auth-Token': this.apiKey },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `football-data.org ${res.status} ${path}: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }

  async fetchTeams(): Promise<ProviderTeam[]> {
    type Resp = {
      teams: Array<{
        id: number;
        name: string;
        tla: string | null;
      }>;
    };
    const json = await this.get<Resp>(`/competitions/${COMPETITION}/teams`);
    return json.teams.map((t) => ({
      externalId: String(t.id),
      name: t.name,
      shortCode: t.tla ?? null,
      group: null,
    }));
  }

  async fetchFixtures(): Promise<ProviderFixture[]> {
    const json = await this.get<MatchesResp>(
      `/competitions/${COMPETITION}/matches`,
    );
    return json.matches.map(mapMatch);
  }

  /**
   * WC matches in the live window plus recent kickoffs with scores.
   * UTC "today" alone misses US evening games after midnight UTC.
   */
  async fetchLiveFixtures(): Promise<ProviderFixture[]> {
    const now = Date.now();
    const json = await this.get<MatchesResp>(
      `/competitions/${COMPETITION}/matches`,
    );
    return json.matches
      .filter((m) => isRecentKickoff(m.utcDate, now) && isLiveOrScoredMatch(m))
      .map(mapMatch);
  }

  /** Finished matches from the last 48h — used to correct wrong FT scores. */
  async fetchRecentFixtures(): Promise<ProviderFixture[]> {
    const now = Date.now();
    const json = await this.get<MatchesResp>(
      `/competitions/${COMPETITION}/matches`,
    );
    return json.matches
      .filter(
        (m) =>
          isRecentKickoff(m.utcDate, now) &&
          m.status === 'FINISHED' &&
          scoresFromApi(m.score).homeScore != null,
      )
      .map(mapMatch);
  }

  async fetchTopScorers(): Promise<ProviderTopScorer[]> {
    type Resp = {
      scorers: Array<{
        player: { id: number; name: string };
        team: { id: number | null } | null;
        goals: number | null;
        assists: number | null;
      }>;
    };
    const json = await this.get<Resp>(
      `/competitions/${COMPETITION}/scorers?limit=30`,
    );
    return json.scorers.map((s, i) => ({
      playerExternalId: String(s.player.id),
      playerName: s.player.name,
      teamExternalId: s.team?.id != null ? String(s.team.id) : null,
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      position: i + 1,
    }));
  }
}
