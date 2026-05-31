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
  groupFixtureId,
  knockoutFixtureId,
  sortFixtures,
  teamIdFor,
} from '../_shared/idMap.ts';

interface SyncReport {
  ok: boolean;
  provider: string;
  teams: number;
  groupMatches: number;
  knockoutMatches: number;
  players: number;
  topScorers: number;
  durationMs: number;
  error?: string;
}

async function sync(): Promise<SyncReport> {
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
      matchRows.push({
        id: groupFixtureId(f, i),
        group: f.group,
        round: f.groupRound,
        kickoff: f.kickoff,
        home_team_id: homeId,
        away_team_id: awayId,
        home_score: f.homeScore,
        away_score: f.awayScore,
        status: f.status,
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
        home_score: f.homeScore,
        away_score: f.awayScore,
        status: f.status,
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
    provider: provider.name,
    teams: teamRows.length,
    groupMatches: matchRows.length,
    knockoutMatches: knockoutRows.length,
    players: playerRows.length,
    topScorers: topscorerRows.length,
    durationMs: Date.now() - start,
  };
}

Deno.serve(async (req) => {
  // Allow GET for human triggering and POST for scheduled invocations.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  try {
    const report = await sync();
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
