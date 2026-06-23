import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  anyInLiveSyncWindow,
  POST_MATCH_MS,
  PRE_MATCH_MS,
} from './liveSyncWindow.ts';

const LIVE_CRON_MAX_AGE_MS = 4 * 60 * 1000;
const STALE_SCORE_GRACE_MS = 12 * 60 * 1000;

type SyncHealthRow = {
  mode: string;
  last_run_at: string;
  last_ok_at: string | null;
  ok: boolean;
  live_updated: number;
  skipped: boolean;
  skip_reason: string | null;
  error: string | null;
};

type StaleMatch = {
  id: string;
  kickoff: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

export async function buildHealthCheck(
  supabase: ReturnType<typeof createClient>,
  now = Date.now(),
): Promise<{
  healthy: boolean;
  issues: string[];
  inLiveWindow: boolean;
  syncHealth: SyncHealthRow[];
  staleMatches: StaleMatch[];
}> {
  const issues: string[] = [];

  const { data: healthRows, error: healthErr } = await supabase
    .from('sync_health')
    .select('*')
    .order('mode');
  if (healthErr) issues.push(`sync_health read: ${healthErr.message}`);

  const windowStart = new Date(now - POST_MATCH_MS).toISOString();
  const windowEnd = new Date(now + PRE_MATCH_MS).toISOString();
  const staleBefore = new Date(now - STALE_SCORE_GRACE_MS).toISOString();

  const kickoffRows: { kickoff: string; status: string }[] = [];
  const staleMatches: StaleMatch[] = [];

  for (const table of ['matches', 'knockout_matches'] as const) {
    const { data: inPlay } = await supabase
      .from(table)
      .select('kickoff, status')
      .eq('status', 'in_play');
    const { data: inWindow } = await supabase
      .from(table)
      .select('kickoff, status')
      .gte('kickoff', windowStart)
      .lte('kickoff', windowEnd);
    kickoffRows.push(...(inPlay ?? []), ...(inWindow ?? []));

    const { data: stale } = await supabase
      .from(table)
      .select('id, kickoff, status, home_score, away_score')
      .gte('kickoff', windowStart)
      .lt('kickoff', staleBefore)
      .in('status', ['scheduled', 'in_play'])
      .or('home_score.is.null,away_score.is.null');
    staleMatches.push(...(stale ?? []));
  }

  const inLiveWindow = anyInLiveSyncWindow(kickoffRows, now);
  const liveRow = (healthRows ?? []).find((r) => r.mode === 'live') as
    | SyncHealthRow
    | undefined;

  if (inLiveWindow) {
    if (!liveRow) {
      issues.push('live sync has never recorded a run');
    } else {
      const age = now - new Date(liveRow.last_run_at).getTime();
      if (age > LIVE_CRON_MAX_AGE_MS) {
        issues.push(
          `live sync last ran ${Math.round(age / 60_000)} min ago (max ${LIVE_CRON_MAX_AGE_MS / 60_000} min during matches)`,
        );
      }
      if (!liveRow.ok && liveRow.error) {
        issues.push(`live sync error: ${liveRow.error}`);
      }
    }
  }

  if (staleMatches.length > 0) {
    issues.push(
      `${staleMatches.length} match(es) live without scores: ${staleMatches.map((m) => m.id).join(', ')}`,
    );
  }

  const fullRow = (healthRows ?? []).find((r) => r.mode === 'full') as
    | SyncHealthRow
    | undefined;
  if (fullRow) {
    const age = now - new Date(fullRow.last_run_at).getTime();
    if (age > 25 * 60 * 1000) {
      issues.push(`full sync last ran ${Math.round(age / 60_000)} min ago`);
    }
  } else {
    issues.push('full sync has never recorded a run');
  }

  return {
    healthy: issues.length === 0,
    issues,
    inLiveWindow,
    syncHealth: (healthRows ?? []) as SyncHealthRow[],
    staleMatches,
  };
}
