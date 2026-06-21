// Fetch api-football fixture events and upsert into match_events.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  mapApiFootballEvents,
  reconcileMappedGoalEvents,
  type ApiFootballEvent,
} from './matchEventMapping.ts';

const BASE = 'https://v3.football.api-sports.io';
const RECENT_FINISHED_MS = 48 * 60 * 60 * 1000;

type FinishedMatchRow = {
  id: string;
  external_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
};

async function fetchFixtureEvents(
  apiKey: string,
  fixtureExternalId: string,
): Promise<ApiFootballEvent[]> {
  const res = await fetch(
    `${BASE}/fixtures/events?fixture=${fixtureExternalId}`,
    {
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `api-football events ${res.status} fixture=${fixtureExternalId}: ${body.slice(0, 200)}`,
    );
  }
  const json = await res.json();
  return (json.response ?? []) as ApiFootballEvent[];
}

async function teamExternalIds(
  supabase: ReturnType<typeof createClient>,
  homeTeamId: string,
  awayTeamId: string,
): Promise<{ home: string | null; away: string | null }> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, external_id')
    .in('id', [homeTeamId, awayTeamId]);
  if (error) throw new Error(`teams lookup: ${error.message}`);

  const home = data?.find((t) => t.id === homeTeamId)?.external_id ?? null;
  const away = data?.find((t) => t.id === awayTeamId)?.external_id ?? null;
  return { home, away };
}

async function upsertEventsForMatch(
  supabase: ReturnType<typeof createClient>,
  matchId: string,
  rows: ReturnType<typeof mapApiFootballEvents>,
): Promise<void> {
  const { error: delErr } = await supabase
    .from('match_events')
    .delete()
    .eq('match_id', matchId);
  if (delErr) throw new Error(`match_events delete: ${delErr.message}`);

  if (rows.length === 0) return;

  const payload = rows.map((r) => ({
    match_id: matchId,
    minute: r.minute,
    type: r.type,
    team_side: r.team_side,
    player_name: r.player_name,
    detail: r.detail,
    sort_order: r.sort_order,
  }));

  const { error: insErr } = await supabase.from('match_events').insert(payload);
  if (insErr) throw new Error(`match_events insert: ${insErr.message}`);
}

export async function syncEventsForMatch(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  match: FinishedMatchRow,
): Promise<boolean> {
  const { home, away } = await teamExternalIds(
    supabase,
    match.home_team_id,
    match.away_team_id,
  );

  const apiEvents = await fetchFixtureEvents(apiKey, match.external_id);
  const mapped = mapApiFootballEvents(apiEvents, home, away);
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const reconciled = reconcileMappedGoalEvents(mapped, homeScore, awayScore);
  await upsertEventsForMatch(supabase, match.id, reconciled);
  return reconciled.length > 0;
}

export async function syncRecentFinishedMatchEvents(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
): Promise<number> {
  const since = new Date(Date.now() - RECENT_FINISHED_MS).toISOString();

  const { data, error } = await supabase
    .from('matches')
    .select('id, external_id, home_team_id, away_team_id, kickoff, home_score, away_score')
    .eq('status', 'finished')
    .gte('kickoff', since)
    .not('external_id', 'is', null);
  if (error) throw new Error(`finished matches lookup: ${error.message}`);

  let synced = 0;
  for (const row of data ?? []) {
    try {
      const ok = await syncEventsForMatch(
        supabase,
        apiKey,
        row as FinishedMatchRow,
      );
      if (ok) synced += 1;
    } catch (err) {
      console.error(
        `[matchEvents] sync failed for ${row.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return synced;
}
