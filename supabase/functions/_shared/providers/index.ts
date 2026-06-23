// Provider selection. The Edge Function reads FOOTBALL_PROVIDER from its
// secrets (football-data.org only).

import type { FootballProvider } from './types.ts';
import { FootballDataProvider } from './footballData.ts';

export type ProviderName = 'football-data';

export function selectProvider(
  name: ProviderName,
  env: Record<string, string | undefined>,
): FootballProvider {
  if (name !== 'football-data') {
    throw new Error(`Unknown provider: ${name}. Only football-data is supported.`);
  }
  return new FootballDataProvider(env.FOOTBALL_DATA_API_KEY ?? '');
}

export type { FootballProvider };
export type {
  ProviderFixture,
  ProviderTeam,
  ProviderTopScorer,
} from './types.ts';
