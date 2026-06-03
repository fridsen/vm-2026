import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePayments } from '../hooks/usePayments.js';
import { ENTRY_FEE_SEK, SWISH_NUMBER, setPaid } from '../services/paymentsService.js';
import { fetchPaymentStatus, sendPaymentReminder } from '../services/adminService.js';

export default function AdminPaymentsPage() {
  const { isAdmin, loading: adminLoading } = usePayments();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchPaymentStatus(true));
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (adminLoading) {
    return <div className="p-8 text-center text-neutral-500">Laddar…</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  async function handleMarkPaid(userId) {
    setBusyId(userId);
    try {
      await setPaid(userId, true, { amountSek: ENTRY_FEE_SEK || undefined });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReminder(userId) {
    setBusyId(`remind-${userId}`);
    try {
      await sendPaymentReminder(userId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="tab-page-enter max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-neutral-900">Admin — Betalningar</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Obetalda spelare. Swish: {SWISH_NUMBER || '—'}, avgift: {ENTRY_FEE_SEK || '—'} kr
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">Laddar lista…</p>
      ) : rows.length === 0 ? (
        <p className="text-neutral-500">Inga obetalda spelare.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.user_id}
              className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-card"
            >
              <div className="font-bold text-neutral-900">{row.display_name}</div>
              <div className="text-sm text-neutral-600">{row.email || 'Ingen e-post'}</div>
              <div className="mt-1 text-xs text-neutral-500">
                Har betalat (själv): {row.payment_ack ? 'ja' : 'nej'}
                {row.last_reminder_at && (
                  <> · Senaste påminnelse: {new Date(row.last_reminder_at).toLocaleString('sv-SE')}</>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-green-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  disabled={busyId === row.user_id}
                  onClick={() => handleMarkPaid(row.user_id)}
                >
                  Markera betald
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-800 disabled:opacity-50"
                  disabled={busyId === `remind-${row.user_id}`}
                  onClick={() => handleReminder(row.user_id)}
                >
                  Skicka påminnelse
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
