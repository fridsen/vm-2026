import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { usePayments } from '../hooks/usePayments.js';
import { useAppData } from '../hooks/useAppData.js';
import {
  fetchSyncHealthProbe,
  fetchSyncHealthRows,
  triggerLiveSync,
} from '../services/syncHealthService.js';
import { staleLiveMatches } from '../utils/staleLiveMatches.js';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sv-SE');
}

function StatusPill({ ok, label }) {
  return (
    <span
      className={
        ok
          ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'
          : 'inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800'
      }
    >
      {label}
    </span>
  );
}

export default function AdminSyncPage() {
  const { isAdmin, loading: adminLoading } = usePayments();
  const { groupMatches, knockoutMatches, refreshLiveData } = useAppData();
  const [rows, setRows] = useState([]);
  const [probe, setProbe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const stale = staleLiveMatches([...groupMatches, ...knockoutMatches]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRows, healthProbe] = await Promise.all([
        fetchSyncHealthRows(),
        fetchSyncHealthProbe(),
      ]);
      setRows(healthRows);
      setProbe(healthProbe);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const id = window.setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [isAdmin, load]);

  if (adminLoading) {
    return <div className="p-8 text-center text-neutral-500">Laddar…</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  async function handleTriggerLive() {
    setBusy(true);
    setError(null);
    try {
      await triggerLiveSync();
      await refreshLiveData();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const probeHealthy = probe?.ok && probe?.body?.healthy;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Matchsync</h1>
        <Link to="/admin/betalningar" className="text-sm font-medium text-ink/70">
          Betalningar
        </Link>
      </div>

      <p className="mb-6 text-sm text-ink/70">
        Övervakar att cron-jobb och API-uppdateringar håller live-resultat i fas. Sidan uppdateras
        var 30:e sekund under VM.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <section className="card mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Hälsokontroll</h2>
          <StatusPill ok={probeHealthy} label={probeHealthy ? 'OK' : 'Problem'} />
        </div>
        {loading && !probe ? (
          <p className="text-sm text-neutral-500">Laddar…</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink/80">
            {(probe?.body?.issues ?? []).length === 0 ? (
              <li>Inga kända problem just nu.</li>
            ) : (
              probe.body.issues.map((issue) => <li key={issue}>• {issue}</li>)
            )}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink/50">
          Extern monitor:{' '}
          <code className="rounded bg-black/5 px-1">/functions/v1/sync-fixtures?mode=health</code>
          {' '}(503 = problem)
        </p>
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-3 font-semibold text-ink">Senaste körningar</h2>
        {loading && rows.length === 0 ? (
          <p className="text-sm text-neutral-500">Laddar…</p>
        ) : (
          <div className="space-y-3 text-sm">
            {rows.map((row) => (
              <div key={row.mode} className="rounded-lg bg-black/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium uppercase">{row.mode}</span>
                  <StatusPill ok={row.ok} label={row.ok ? 'OK' : 'Fel'} />
                </div>
                <p>Senast: {formatTime(row.last_run_at)}</p>
                <p>Senast lyckad: {formatTime(row.last_ok_at)}</p>
                {row.skipped && <p>Hoppades över: {row.skip_reason}</p>}
                {row.mode === 'live' && <p>Uppdaterade: {row.live_updated}</p>}
                {row.error && <p className="text-red-700">{row.error}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {stale.length > 0 && (
        <section className="card mb-4 border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 font-semibold text-amber-900">Matcher utan resultat</h2>
          <ul className="text-sm text-amber-900">
            {stale.map((m) => (
              <li key={m.id}>
                {m.id} — kickoff {formatTime(m.kickoff)}, status {m.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={handleTriggerLive}
        disabled={busy}
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Synkar…' : 'Kör live-sync nu'}
      </button>
    </div>
  );
}
