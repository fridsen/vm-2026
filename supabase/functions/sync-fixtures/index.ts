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
import {
  scoreFieldsForFullSync,
  type ExistingScoreRow,
} from '../_shared/scoreFields.ts';
import { buildLiveScorePatch } from '../_shared/liveScorePatch.ts';
import {
  anyInLiveSyncWindow,
  POST_MATCH_MS,
  PRE_MATCH_MS,
  type KickoffRow,
} from '../_shared/liveSyncWindow.ts';
import { buildHealthCheck } from '../_shared/healthCheck.ts';
import { recordSyncHealth } from '../_shared/syncHealth.ts';
import { syncRecentFinishedMatchEvents } from '../_shared/matchEvents.ts';

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
  eventsSynced?: number;
  durationMs: number;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

function groupLetterByTeamExternalId(
  fixtures: ProviderFixture[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of fixtures) {
    if (f.stage !== 'group' || !f.group) continue;
    if (f.homeTeamExternalId) map.set(f.homeTeamExternalId, f.group);
    if (f.awayTeamExternalId) map.set(f.awayTeamExternalId, f.group);
  }
  return map;
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

    const scorePatch = buildLiveScorePatch(existing, {
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      status: f.status,
    });
    if (!scorePatch) continue;

    const patch: Record<string, unknown> = {
      ...scorePatch,
      updated_at: new Date().toISOString(),
    };

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
  // 135 min covers 90 + HT + 30 ET + stoppage before auto-finalizing.
  const staleBefore = new Date(Date.now() - 135 * 60 * 1000).toISOString();
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

async function loadKickoffRowsForLiveWindow(
  supabase: ReturnType<typeof createClient>,
  now = Date.now(),
): Promise<KickoffRow[]> {
  const windowStart = new Date(now - POST_MATCH_MS).toISOString();
  const windowEnd = new Date(now + PRE_MATCH_MS).toISOString();
  const rows: KickoffRow[] = [];

  for (const table of ['matches', 'knockout_matches'] as const) {
    const { data: inPlay, error: inPlayErr } = await supabase
      .from(table)
      .select('kickoff, status')
      .eq('status', 'in_play');
    if (inPlayErr) throw new Error(`${table} in_play: ${inPlayErr.message}`);

    const { data: inWindow, error: windowErr } = await supabase
      .from(table)
      .select('kickoff, status')
      .gte('kickoff', windowStart)
      .lte('kickoff', windowEnd);
    if (windowErr) throw new Error(`${table} window: ${windowErr.message}`);

    rows.push(...(inPlay ?? []), ...(inWindow ?? []));
  }

  return rows;
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
  const kickoffRows = await loadKickoffRowsForLiveWindow(supabase);
  const inWindow = anyInLiveSyncWindow(kickoffRows);

  if (!inWindow) {
    try {
      liveUpdated += await finalizeStaleInPlayMatches(supabase);
    } catch (err) {
      console.error('[sync-fixtures] finalize stale matches failed:', err);
    }

    // Reconcile recently finished matches even outside the live window — late
    // goals or auto-finalize can leave wrong FT scores until the provider catches up.
    if (provider.fetchRecentFixtures) {
      try {
        const recent = await provider.fetchRecentFixtures();
        liveUpdated += await upsertLiveScores(supabase, recent);
      } catch (err) {
        console.error('[sync-fixtures] recent finished reconcile failed:', err);
      }
    }

    let eventsSynced = 0;
    if (apiFootballKey) {
      try {
        eventsSynced = await syncRecentFinishedMatchEvents(supabase, apiFootballKey);
      } catch (err) {
        console.error('[sync-fixtures] match events sync failed:', err);
      }
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
      eventsSynced,
      skipped: true,
      skipReason: 'no_match_in_live_window',
      durationMs: Date.now() - start,
    };
  }

  // api-football is the primary live source during matches.
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
  }

  // Always run football-data.org live too — it matches rows by external_id and
  // catches FT results when api-football name matching misses (e.g. Korea Republic).
  if (provider.fetchLiveFixtures) {
    try {
      const fixtures = await provider.fetchLiveFixtures();
      liveUpdated += await upsertLiveScores(supabase, fixtures);
    } catch (err) {
      console.error('[sync-fixtures] football-data live failed:', err);
    }
  }

  try {
    liveUpdated += await finalizeStaleInPlayMatches(supabase);
  } catch (err) {
    console.error('[sync-fixtures] finalize stale matches failed:', err);
  }

  if (provider.fetchRecentFixtures) {
    try {
      const recent = await provider.fetchRecentFixtures();
      liveUpdated += await upsertLiveScores(supabase, recent);
    } catch (err) {
      console.error('[sync-fixtures] recent finished reconcile failed:', err);
    }
  }

  let eventsSynced = 0;
  if (apiFootballKey) {
    try {
      eventsSynced = await syncRecentFinishedMatchEvents(supabase, apiFootballKey);
    } catch (err) {
      console.error('[sync-fixtures] match events sync failed:', err);
    }
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
    eventsSynced,
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

  // ── 1. Fixtures (fetch first — team groups live on fixtures, not team rows) ─
  const fixtures = await provider.fetchFixtures();
  const teamGroups = groupLetterByTeamExternalId(fixtures);

  // ── 2. Teams ────────────────────────────────────────────────────
  const teams = await provider.fetchTeams();
  const teamRows = teams.map((t: ProviderTeam) => ({
    id: teamIdFor(t),
    name: t.name,
    code: t.shortCode ?? teamIdFor(t),
    flag: null,
    group: t.group ?? teamGroups.get(t.externalId) ?? '?',
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

async function runAndRecord(
  mode: 'live' | 'full',
  run: () => Promise<SyncReport>,
): Promise<SyncReport> {
  const env = Deno.env.toObject();
  const supabase = createClient(
    env.SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  try {
    const report = await run();
    await recordSyncHealth(supabase, report);
    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failed: SyncReport = {
      ok: false,
      mode,
      provider: 'unknown',
      teams: 0,
      groupMatches: 0,
      knockoutMatches: 0,
      players: 0,
      topScorers: 0,
      liveUpdated: 0,
      durationMs: 0,
      error: message,
    };
    await recordSyncHealth(supabase, failed);
    throw err;
  }
}

Deno.serve(async (req) => {
  // Allow GET for human triggering and POST for scheduled invocations.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  try {
    const url = new URL(req.url);
    const modeParam = url.searchParams.get('mode');
    const env = Deno.env.toObject();
    const supabase = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    if (modeParam === 'health') {
      const check = await buildHealthCheck(supabase);
      return new Response(JSON.stringify(check, null, 2), {
        status: check.healthy ? 200 : 503,
        headers: { 'content-type': 'application/json' },
      });
    }

    const mode = modeParam === 'live' ? 'live' : 'full';
    const report = await runAndRecord(
      mode,
      mode === 'live' ? syncLive : syncFull,
    );
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
