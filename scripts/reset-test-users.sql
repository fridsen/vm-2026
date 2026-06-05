-- Wipe all player data before go-live. Keeps admins allowlist, fixtures, teams, etc.

delete from public.prediction_events;
delete from public.prediction_snapshots;
delete from public.payment_reminders;
delete from public.predictions;
delete from public.payments;
delete from public.profiles;
