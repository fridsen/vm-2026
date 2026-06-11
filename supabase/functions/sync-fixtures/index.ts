// sync-fixtures Edge Function.
//
// Pulls the WC 2026 dataset from the configured provider and upserts it into
// our Postgres tables. Designed to be cheap to run repeatedly (idempotent
// upsert by external_id, no deletes), so a 10-minute cron during match days
// stays well within free-tier rate limits for both providers.
//
// Trigger:
//   - Scheduled via pg_cron (see supabase/migrations/.../cron.sql) OR
//   - Manually: `curl -X POST <url>/functions/v1/sync-fixtures \
//                    -H "Authorization: Bearer $SUPABASE_ANON_KEY"`
//
// Secrets the function expects:
//   FOOTBALL_PROVIDER          'football-data' | 'api-football'  (default 'football-data')
//   FOOTBALL_DATA_API_KEY      required when provider = football-data
//   API_FOOTBALL_KEY           required when provider = api-football
//   SUPABASE_URL               injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  injected by Supabase

// deno-lint-ignore-file no-external-import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  selectProvider,
  type ProviderFixture,
  type ProviderName,
  type ProviderTeam,
  type ProviderTopScorer,
} from '../_shared/providers/index.ts';
import {
  upsertApiFootballLiveScores,
  upsertApiFootballTodayFixtures,
} from '../_shared/apiFootballLive.ts';
import {
  groupFixtureId,
  knockoutFixtureId,
  sortFixtures,
  teamIdFor,
} from '../_shared/idMap.ts';

interface SyncReport {
  ok: boolean;
  mode: 'full' | 'live';
  provider: string;
  teams: number;
  groupMatches: number;
  knockoutMatches: number;
  players: number;
  topScorers: number;
  liveUpdated: number;
  durationMs: number;
  error?: string;
}

type ExistingScoreRow = {
  external_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

/** football-data often returns TIMED/scheduled with null scores during live games. */
function scoreFieldsForFullSync(
  f: ProviderFixture,
  existing?: ExistingScoreRow,
): { home_score: number | null; away_score: number | null; status: string } {
  const hasScores = f.homeScore != null && f.awayScore != null;

  if (f.status === 'finished' && hasScores) {
    return {
      home_score: f.homeScore!,
      away_score: f.awayScore!,
      status: 'finished',
    };
  }

  if (hasScores && f.status === 'in_play') {
    return {
      home_score: f.homeScore!,
      away_score: f.awayScore!,
      status: 'in_play',
    };
  }

  // Keep finished rows when football-data hasn't caught up yet.
  if (existing?.status === 'finished') {
    return {
      home_score: hasScores ? f.homeScore! : existing.home_score,
      away_score: hasScores ? f.awayScore! : existing.away_score,
      status: 'finished',
    };
  }

  // Keep in_play scores only while football-data still shows scheduled/null.
  if (existing?.status === 'in_play' && f.status === 'scheduled' && !hasScores) {
    return {
      home_score: existing.home_score,
      away_score: existing.away_score,
      status: 'in_play',
    };
  }

  return {
    home_score: f.homeScore,
    away_score: f.awayScore,
    status: f.status,
  };
}

async function loadExistingScores(
  supabase: ReturnType<typeof createClient>,
  table: 'matches' | 'knockout_matches',
): Promise<Map<string, ExistingScoreRow>> {
  const { data, error } = await supabase
    .from(table)
    .select('external_id, home_score, away_score, status')
    .not('external_id', 'is', null);
  if (error) throw new Error(`${table} score lookup: ${error.message}`);
  const map = new Map<string, ExistingScoreRow>();
  for (const row of data ?? []) {
    if (row.external_id) map.set(row.external_id, row as ExistingScoreRow);
  }
  return map;
}

async function upsertLiveScores(
  supabase: ReturnType<typeof createClient>,
  fixtures: ProviderFixture[],
): Promise<number> {
  let updated = 0;
  for (const f of fixtures) {
    const table = f.stage === 'group' ? 'matches' : 'knockout_matches';
    const { data: existing, error: loadErr } = await supabase
      .from(table)
      .select('home_score, away_score, status')
      .eq('external_id', f.externalId)
      .maybeSingle();
    if (loadErr) throw new Error(`${table} live lookup: ${loadErr.message}`);

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Never wipe or downgrade live goals — football-data.org lags during WC.
    if (f.homeScore != null && f.awayScore != null) {
      const newTotal = f.homeScore + f.awayScore;
      const existingTotal =
        (existing?.home_score ?? 0) + (existing?.away_score ?? 0);
      const wouldDowngrade =
        existing?.status === 'in_play' && newTotal < existingTotal;
      if (!wouldDowngrade) {
        patch.home_score = f.homeScore;
        patch.away_score = f.awayScore;
      }
    }
    if (f.status === 'finished') {
      patch.status = 'finished';
    } else if (f.status === 'in_play' && existing?.status !== 'finished') {
      patch.status = 'in_play';
    }

    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq('external_id', f.externalId)
      .select('id');
    if (error) throw new Error(`${table} live update: ${error.message}`);
    if (data?.length) updated += data.length;
  }
  return updated;
}

/** Safety net when live feeds drop a match before marking it finished. */
async function finalizeStaleInPlayMatches(
  supabase: ReturnType<typeof createClient>,
): Promise<number> {
  const staleBefore = new Date(Date.now() - 115 * 60 * 1000).toISOString();
  let updated = 0;

  for (const table of ['matches', 'knockout_matches'] as const) {
    const { data, error } = await supabase
      .from(table)
      .update({
        status: 'finished',
        live_minute: null,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'in_play')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .lt('kickoff', staleBefore)
      .select('id');
    if (error) throw new Error(`${table} finalize: ${error.message}`);
    updated += data?.length ?? 0;
  }

  return updated;
}

async function syncLive(): Promise<SyncReport> {
  const start = Date.now();
  const env = Deno.env.toObject();
  const providerName = (env.FOOTBALL_PROVIDER ?? 'football-data') as ProviderName;
  const provider = selectProvider(providerName, env);

  if (!provider.fetchLiveFixtures) {
    throw new Error(
      `Provider ${provider.name} does not support live sync — use full sync or football-data`,
    );
  }

  const supabase = createClient(
    env.SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  let liveUpdated = 0;
  const apiFootballKey = env.API_FOOTBALL_KEY?.trim();

  // api-football is the reliable live source during matches.
  if (apiFootballKey) {
    try {
      liveUpdated += await upsertApiFootballLiveScores(supabase, apiFootballKey);
    } catch (err) {
      console.error('[sync-fixtures] api-football live failed:', err);
    }
    try {
      liveUpdated += await upsertApiFootballTodayFixtures(supabase, apiFootballKey);
    } catch (err) {
      console.error('[sync-fixtures] api-football today failed:', err);
    }
  } else if (provider.fetchLiveFixtures) {
    const fixtures = await provider.fetchLiveFixtures();
    liveUpdated += await upsertLiveScores(supabase, fixtures);
  }

  try {
    liveUpdated += await finalizeStaleInPlayMatches(supabase);
  } catch (err) {
    console.error('[sync-fixtures] finalize stale matches failed:', err);
  }

  return {
    ok: true,
    mode: 'live',
    provider: apiFootballKey
      ? `${provider.name} + api-football live`
      : provider.name,
    teams: 0,
    groupMatches: 0,
    knockoutMatches: 0,
    players: 0,
    topScorers: 0,
    liveUpdated,
    durationMs: Date.now() - start,
  };
}

async function syncFull(): Promise<SyncReport> {
  const start = Date.now();
  const env = Deno.env.toObject();
  const providerName = (env.FOOTBALL_PROVIDER ?? 'football-data') as ProviderName;
  const provider = selectProvider(providerName, env);

  const supabase = createClient(
    env.SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // ── 1. Teams ────────────────────────────────────────────────────
  const teams = await provider.fetchTeams();
  const teamRows = teams.map((t: ProviderTeam) => ({
    id: teamIdFor(t),
    name: t.name,
    code: t.shortCode ?? teamIdFor(t),
    flag: null,
    group: t.group ?? '?',
    external_id: t.externalId,
  }));

  // Build a lookup so we can resolve fixtures' externalId → internal team id.
  const externalToInternal = new Map<string, string>();
  for (const r of teamRows) externalToInternal.set(r.external_id, r.id);

  if (teamRows.length > 0) {
    const { error } = await supabase
      .from('teams')
      .upsert(teamRows, { onConflict: 'external_id' });
    if (error) throw new Error(`teams upsert: ${error.message}`);
  }

  // ── 2. Fixtures ─────────────────────────────────────────────────
  const fixtures = await provider.fetchFixtures();

  const groupFixtures = fixtures.filter(
    (f: ProviderFixture) => f.stage === 'group' && f.group && f.groupRound,
  );
  const knockoutFixtures = fixtures.filter(
    (f: ProviderFixture) => f.stage === 'knockout' && f.knockoutRound,
  );

  // Group matches: bucket by (group, round) so we can hand out stable
  // M1/M2/etc. indices within each bucket by kickoff order.
  const groupBuckets = new Map<string, ProviderFixture[]>();
  for (const f of groupFixtures) {
    const key = `${f.group}|${f.groupRound}`;
    const list = groupBuckets.get(key) ?? [];
    list.push(f);
    groupBuckets.set(key, list);
  }

  const existingGroupScores = await loadExistingScores(supabase, 'matches');

  const matchRows: Array<Record<string, unknown>> = [];
  for (const list of groupBuckets.values()) {
    const sorted = sortFixtures(list);
    sorted.forEach((f, i) => {
      const homeId =
        f.homeTeamExternalId && externalToInternal.get(f.homeTeamExternalId);
      const awayId =
        f.awayTeamExternalId && externalToInternal.get(f.awayTeamExternalId);
      // Skip rows we can't resolve — provider may have published a fixture
      // before publishing the participating teams. They'll catch up next sync.
      if (!homeId || !awayId) return;
      const scores = scoreFieldsForFullSync(
        f,
        existingGroupScores.get(f.externalId),
      );
      matchRows.push({
        id: groupFixtureId(f, i),
        group: f.group,
        round: f.groupRound,
        kickoff: f.kickoff,
        home_team_id: homeId,
        away_team_id: awayId,
        ...scores,
        external_id: f.externalId,
      });
    });
  }

  if (matchRows.length > 0) {
    const { error } = await supabase
      .from('matches')
      .upsert(matchRows, { onConflict: 'external_id' });
    if (error) throw new Error(`matches upsert: ${error.message}`);
  }

  // Knockout matches: bucket by round.
  const knockoutBuckets = new Map<string, ProviderFixture[]>();
  for (const f of knockoutFixtures) {
    const list = knockoutBuckets.get(f.knockoutRound!) ?? [];
    list.push(f);
    knockoutBuckets.set(f.knockoutRound!, list);
  }

  const existingKnockoutScores = await loadExistingScores(
    supabase,
    'knockout_matches',
  );

  const knockoutRows: Array<Record<string, unknown>> = [];
  for (const [round, list] of knockoutBuckets.entries()) {
    const sorted = sortFixtures(list);
    sorted.forEach((f, i) => {
      const homeId = f.homeTeamExternalId
        ? externalToInternal.get(f.homeTeamExternalId) ?? null
        : null;
      const awayId = f.awayTeamExternalId
        ? externalToInternal.get(f.awayTeamExternalId) ?? null
        : null;
      const scores = scoreFieldsForFullSync(
        f,
        existingKnockoutScores.get(f.externalId),
      );
      knockoutRows.push({
        id: knockoutFixtureId(f, i),
        round,
        label: `${round} ${i + 1}`,
        kickoff: f.kickoff,
        home_team_id: homeId,
        away_team_id: awayId,
        // home/away source can be enriched once we know the bracket layout
        // pattern. For now we leave it null — the client doesn't read it
        // when concrete teams are filled in.
        home_source: null,
        away_source: null,
        ...scores,
        external_id: f.externalId,
      });
    });
  }

  if (knockoutRows.length > 0) {
    const { error } = await supabase
      .from('knockout_matches')
      .upsert(knockoutRows, { onConflict: 'external_id' });
    if (error) throw new Error(`knockout_matches upsert: ${error.message}`);
  }

  // ── 3. Top scorers ──────────────────────────────────────────────
  const topScorers = await provider.fetchTopScorers();

  const playerRows = topScorers.map((s: ProviderTopScorer) => {
    const teamCode = s.teamExternalId
      ? externalToInternal.get(s.teamExternalId) ?? null
      : null;
    return {
      id: `p_${s.playerExternalId}`,
      name: s.playerName,
      team_code: teamCode,
      position: null,
      external_id: s.playerExternalId,
    };
  });

  if (playerRows.length > 0) {
    const { error } = await supabase
      .from('players')
      .upsert(playerRows, { onConflict: 'external_id' });
    if (error) throw new Error(`players upsert: ${error.message}`);
  }

  const topscorerRows = topScorers.map((s: ProviderTopScorer) => ({
    player_id: `p_${s.playerExternalId}`,
    goals: s.goals,
    assists: s.assists,
    cards: 0,
    position: s.position,
  }));

  if (topscorerRows.length > 0) {
    const { error } = await supabase
      .from('topscorers')
      .upsert(topscorerRows, { onConflict: 'player_id' });
    if (error) throw new Error(`topscorers upsert: ${error.message}`);
  }

  return {
    ok: true,
    mode: 'full',
    provider: provider.name,
    teams: teamRows.length,
    groupMatches: matchRows.length,
    knockoutMatches: knockoutRows.length,
    players: playerRows.length,
    topScorers: topscorerRows.length,
    liveUpdated: 0,
    durationMs: Date.now() - start,
  };
}

Deno.serve(async (req) => {
  // Allow GET for human triggering and POST for scheduled invocations.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') === 'live' ? 'live' : 'full';
    const report = mode === 'live' ? await syncLive() : await syncFull();
    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-fixtures] failed:', message);
    return new Response(
      JSON.stringify({ ok: false, error: message }, null, 2),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
