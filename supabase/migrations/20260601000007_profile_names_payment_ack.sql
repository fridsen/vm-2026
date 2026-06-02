-- Onboarding flow: first/last name + a one-time payment acknowledgement.
--
-- The redesigned signup collects Förnamn/Efternamn (the display_name is still
-- the source of truth for the leaderboard and is set to "First Last"). After
-- signup the player is shown the Swish payment instructions once; clicking
-- "Jag har betalat" flips `payment_ack` so the screen is not shown again.
--
-- `payment_ack` is a self-set acknowledgement only — it does NOT mean the
-- entry fee is confirmed. Actual confirmation still lives in public.payments
-- and is admin-only (see 20260601000004_payments.sql).

alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists payment_ack boolean not null default false;

-- Self-update is already allowed by the "profiles update own" policy from the
-- initial schema, so no new RLS is required for writing payment_ack.
