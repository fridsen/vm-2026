import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export type SyncHealthReport = {
  ok: boolean;
  mode: 'live' | 'full';
  provider: string;
  liveUpdated: number;
  durationMs: number;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
};

export async function recordSyncHealth(
  supabase: ReturnType<typeof createClient>,
  report: SyncHealthReport,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('sync_health')
    .select('last_ok_at')
    .eq('mode', report.mode)
    .maybeSingle();

  const { error } = await supabase.from('sync_health').upsert({
    mode: report.mode,
    last_run_at: now,
    last_ok_at: report.ok ? now : existing?.last_ok_at ?? null,
    ok: report.ok,
    live_updated: report.liveUpdated,
    skipped: report.skipped ?? false,
    skip_reason: report.skipReason ?? null,
    duration_ms: report.durationMs,
    provider: report.provider,
    error: report.error ?? null,
    updated_at: now,
  }, { onConflict: 'mode' });
  if (error) {
    console.error('[sync-health] record failed:', error.message);
  }
}
