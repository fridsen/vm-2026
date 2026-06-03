import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth.js';
import {
  ENTRY_FEE_SEK,
  fetchAllPayments,
  fetchIsAdmin,
  fetchMyPayment,
  setPaid,
} from '../services/paymentsService.js';

// usePayments — exposes the signed-in user's own payment status, whether they
// are an admin, the full payment map (for the leaderboard), and an admin-only
// toggle. Informational only: nothing here gates tipping.
export function usePayments() {
  const { user } = useAuth();
  const userId = user?.id;
  const [isAdmin, setIsAdmin] = useState(false);
  const [myPayment, setMyPayment] = useState(null);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsAdmin(false);
      setMyPayment(null);
      setPayments({});
      setLoading(false);
      return;
    }
    try {
      const [admin, mine, all] = await Promise.all([
        fetchIsAdmin(),
        fetchMyPayment(userId),
        fetchAllPayments(),
      ]);
      setIsAdmin(admin);
      setMyPayment(mine);
      setPayments(all);
    } catch {
      setIsAdmin(false);
      setMyPayment(null);
      setPayments({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) refresh().catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const togglePaid = useCallback(
    async (targetUserId, paid) => {
      // Optimistically flip the local map so the UI updates on click, then
      // reconcile with the server (and revert on failure).
      setPayments((prev) => ({
        ...prev,
        [targetUserId]: { ...(prev[targetUserId] || { user_id: targetUserId }), paid },
      }));
      try {
        await setPaid(targetUserId, paid, { amountSek: ENTRY_FEE_SEK || null });
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  return {
    isAdmin,
    myPayment,
    payments,
    loading,
    refresh,
    togglePaid,
    entryFee: ENTRY_FEE_SEK,
  };
}
