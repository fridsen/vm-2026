import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { usePayments } from '../hooks/usePayments.js';
import { fetchPaymentStatus, fetchPredictionEvents } from '../services/adminService.js';

function formatEvent(row) {
  const when = new Date(row.changed_at).toLocaleString('sv-SE');
  const src = row.source === 'system_default' ? ' (autofylld)' : '';
  if (row.kind === 'match') {
    const oldV = row.old_value;
    const newV = row.new_value;
    const fmt = (v) =>
      v ? `${v.home ?? '–'}-${v.away ?? '–'} (${v.outcome ?? '?'})` : '—';
    return `${when} — Match ${row.key}: ${fmt(oldV)} → ${fmt(newV)}${src}`;
  }
  if (row.kind === 'group_standing') {
    return `${when} — Grupp ${row.key}: ${row.action}${src}`;
  }
  if (row.kind === 'final') {
    const fmt = (v) => {
      if (Array.isArray(v)) return v.filter(Boolean).join(', ') || '—';
      if (typeof v === 'string') return v;
      return '—';
    };
    return `${when} — Topp 3: ${fmt(row.old_value)} → ${fmt(row.new_value)}${src}`;
  }
  return `${when} — ${row.kind} ${row.key}: ${row.action}${src}`;
}

export default function AdminPredictionHistoryPage() {
  const { isAdmin, loading: adminLoading } = usePayments();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchPaymentStatus(false)
      .then((rows) => setUsers(rows))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  const loadEvents = useCallback(async (userId) => {
    setLoading(true);
    try {
      setEvents(await fetchPredictionEvents(userId || null, 200));
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadEvents(selectedUserId || null);
  }, [isAdmin, selectedUserId, loadEvents]);

  if (adminLoading) {
    return <div className="p-8 text-center text-neutral-500">Laddar…</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="tab-page-enter max-w-3xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Admin — Tipphistorik</h1>
          <p className="mt-1 text-sm text-neutral-600">Ändringar i match, grupp och vinnare</p>
        </div>
        <Link to="/admin/betalningar" className="text-sm font-bold text-green-700">
          Betalningar →
        </Link>
      </header>

      <label className="mb-4 block text-sm font-semibold text-neutral-700">
        Filtrera på spelare
        <select
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Alla (senaste 200)</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="text-neutral-500">Laddar…</p>
      ) : events.length === 0 ? (
        <p className="text-neutral-500">Inga händelser.</p>
      ) : (
        <ul className="space-y-2 text-sm text-neutral-800">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="rounded-xl border border-black/[0.06] bg-surface px-3 py-2"
            >
              <span className="font-semibold">{ev.display_name}</span>
              <br />
              {formatEvent(ev)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
