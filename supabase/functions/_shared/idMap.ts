// Helpers for deriving stable internal IDs from provider data.
//
// Predictions are keyed by these internal IDs (e.g. `predictions.key`
// = "A-R1-M1" for a group match), so they MUST be deterministic across
// syncs — the same provider fixture always maps to the same internal id,
// even if we re-run the sync from scratch. That's why we don't fall back
// to the provider's numeric externalId for the primary key: a different
// provider would give a different number for the same match.

import type { ProviderFixture, ProviderTeam } from './providers/types.ts';

const KNOCKOUT_ORDER = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'] as const;

export function teamIdFor(t: ProviderTeam): string {
  if (t.shortCode && /^[A-Z]{2,4}$/.test(t.shortCode)) return t.shortCode;
  // Slug-fallback: take first letters of words, uppercase, ASCII.
  return t.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
}

// Stable per-group-fixture id. Sorting fixtures within a (group, matchday)
// pair by kickoff (then external id) gives a deterministic match index.
export function groupFixtureId(f: ProviderFixture, indexInRound: number): string {
  if (!f.group || !f.groupRound) {
    throw new Error('groupFixtureId requires group + groupRound');
  }
  return `${f.group}-R${f.groupRound}-M${indexInRound + 1}`;
}

export function knockoutFixtureId(
  f: ProviderFixture,
  indexInRound: number,
): string {
  if (!f.knockoutRound) {
    throw new Error('knockoutFixtureId requires knockoutRound');
  }
  // BRONZE and FINAL only have one match each — drop the index suffix to
  // match the existing internal id format ("BRONZE-1", "FINAL-1").
  return `${f.knockoutRound}-${indexInRound + 1}`;
}

export function knockoutRoundIndex(round: string): number {
  return KNOCKOUT_ORDER.indexOf(round as (typeof KNOCKOUT_ORDER)[number]);
}

// Sort fixtures inside a single bucket deterministically: by kickoff time,
// breaking ties on externalId so identical kickoffs don't reorder run-to-run.
export function sortFixtures<T extends { kickoff: string; externalId: string }>(
  arr: T[],
): T[] {
  return [...arr].sort((a, b) => {
    if (a.kickoff !== b.kickoff) return a.kickoff < b.kickoff ? -1 : 1;
    return a.externalId < b.externalId ? -1 : 1;
  });
}
