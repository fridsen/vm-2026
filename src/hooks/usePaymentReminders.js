import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from './useAuth.js';

export function usePaymentReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setReminders([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .eq('user_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReminders(data || []);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismiss = useCallback(
    async (id) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('payment_reminders')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [user?.id],
  );

  return { reminders, loading, refresh, dismiss };
}
