import { supabase, unwrap } from './supabaseClient.js';

export async function fetchPaymentStatus(unpaidOnly = true) {
  return unwrap(
    await supabase.rpc('admin_list_payment_status', {
      p_unpaid_only: unpaidOnly,
    }),
  );
}

export async function fetchPredictionEvents(userId = null, limit = 200) {
  return unwrap(
    await supabase.rpc('admin_list_prediction_events', {
      p_user_id: userId,
      p_limit: limit,
    }),
  );
}

export async function runDeadlineJobs() {
  const { data, error } = await supabase.rpc('admin_run_deadline_jobs');
  if (error) throw error;
  return data;
}

export async function snapshotPredictions(label) {
  const { data, error } = await supabase.rpc('fn_snapshot_all_predictions', {
    p_label: label,
  });
  if (error) throw error;
  return data;
}

export async function sendPaymentReminder(targetUserId) {
  const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
    body: { userId: targetUserId },
  });
  if (error) throw error;
  return data;
}
