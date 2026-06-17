// Adapter interface for football data providers.
//
// Both the sync Edge Function and any future scripts depend on this shape;
// the concrete implementations (football-data.org, api-football) translate
// their respective JSON into these neutral records before anything else
// touches the data.

export interface ProviderTeam {
  externalId: string; // provider-specific id, stringified
  name: string; // canonical English name from the provider
  shortCode: string | null; // e.g. "ENG", null if provider doesn't supply
  group: string | null; // "A".."L", null until the draw is final
}

export interface ProviderFixture {
  externalId: string;
  // Either "group" + round number (1-3) for the group stage,
  // or "knockout" + roundCode (R32 / R16 / QF / SF / BRONZE / FINAL).
  stage: 'group' | 'knockout';
  group?: string; // "A".."L" for group-stage fixtures
  groupRound?: number; // 1, 2, 3
  knockoutRound?: 'R32' | 'R16' | 'QF' | 'SF' | 'BRONZE' | 'FINAL';
  kickoff: string; // ISO 8601, UTC
  homeTeamExternalId: string | null; // null for unresolved knockout slots
  awayTeamExternalId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'in_play' | 'finished' | 'postponed' | 'cancelled';
}

export interface ProviderTopScorer {
  playerExternalId: string;
  playerName: string;
  teamExternalId: string | null;
  goals: number;
  assists: number;
  position: number | null; // ranking position, 1 = top scorer
}

export interface FootballProvider {
  readonly name: string;
  fetchTeams(): Promise<ProviderTeam[]>;
  fetchFixtures(): Promise<ProviderFixture[]>;
  /** Optional lightweight poll for today's live scores (football-data.org). */
  fetchLiveFixtures?(): Promise<ProviderFixture[]>;
  /** Finished fixtures from the last ~48h — for correcting late FT scores. */
  fetchRecentFixtures?(): Promise<ProviderFixture[]>;
  fetchTopScorers(): Promise<ProviderTopScorer[]>;
}
