// Provider selection. The Edge Function reads FOOTBALL_PROVIDER from its
// secrets ("football-data" | "api-football") and we instantiate the right
// adapter with the matching key.

import type { FootballProvider } from './types.ts';
import { FootballDataProvider } from './footballData.ts';
import { ApiFootballProvider } from './apiFootball.ts';

export type ProviderName = 'football-data' | 'api-football';

export function selectProvider(
  name: ProviderName,
  env: Record<string, string | undefined>,
): FootballProvider {
  switch (name) {
    case 'football-data':
      return new FootballDataProvider(env.FOOTBALL_DATA_API_KEY ?? '');
    case 'api-football':
      return new ApiFootballProvider(env.API_FOOTBALL_KEY ?? '');
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export type { FootballProvider };
export type {
  ProviderFixture,
  ProviderTeam,
  ProviderTopScorer,
} from './types.ts';
