-- Level-2 payment tracking (informational, manual Swish).
--
-- Players still pay the entry fee manually in the Swish app. This migration
-- only records WHO has paid so the app can show a paid/unpaid badge. There is
-- no in-app payment flow and nothing is gated on payment status.
--
-- Admin model: an email allowlist in `public.admins`. Add your email there in
-- the Supabase Table Editor. Only allowlisted users can mark payments; there
-- is no in-app UI for managing the allowlist itself.

-- ─────────────────────────────────────────────────────────────────────────
-- Admin allowlist
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.admins (
  email text primary key
);

alter table public.admins enable row level security;

-- Nobody needs to read the raw allowlist from the client — is_admin() reads it
-- server-side via SECURITY DEFINER. Keep it locked down (no policies = no
-- access for anon/authenticated; service_role and the definer function still
-- reach it).

-- is_admin() compares the caller's JWT email against the allowlist. SECURITY
-- DEFINER so it can read public.admins regardless of that table's RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────
-- Payments
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.payments (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  paid       boolean not null default false,
  paid_at    timestamptz,
  amount_sek int,
  note       text,
  updated_at timestamptz not null default now()
);

-- Stamp paid_at automatically when `paid` flips on, clear it when flipped off.
create or replace function public.tg_payments_paid_at()
returns trigger language plpgsql as $$
begin
  if new.paid and (old is null or not old.paid) then
    new.paid_at := coalesce(new.paid_at, now());
  elsif not new.paid then
    new.paid_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_paid_at on public.payments;
create trigger payments_paid_at
  before insert or update on public.payments
  for each row execute function public.tg_payments_paid_at();

drop trigger if exists set_updated_at on public.payments;
create trigger set_updated_at
  before update on public.payments
  for each row execute function public.tg_set_updated_at();

alter table public.payments enable row level security;

-- Everyone signed in can SEE payment status (it drives the leaderboard badge),
-- but only admins can change it. Regular users have no write path at all.
drop policy if exists "payments read all" on public.payments;
create policy "payments read all" on public.payments
  for select using (true);

drop policy if exists "payments admin write" on public.payments;
create policy "payments admin write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Leaderboard view — append a `paid` flag so the UI can badge each row.
-- Columns 1-7 are unchanged; `paid` is appended so `create or replace` is safe.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view public.leaderboard as
with match_scores as (
  select
    p.user_id,
    case
      when sign(coalesce((p.value->>'home')::int,0) - coalesce((p.value->>'away')::int,0))
         = sign(m.home_score - m.away_score)
      then 2 else 0
    end
    + case when (p.value->>'home')::int = m.home_score then 1 else 0 end
    + case when (p.value->>'away')::int = m.away_score then 1 else 0 end
    + case
        when (p.value->>'home')::int = m.home_score
         and (p.value->>'away')::int = m.away_score
        then 1 else 0
      end as points
  from public.predictions p
  join public.matches m on m.id = p.key
  where p.kind = 'match'
    and m.home_score is not null
    and m.away_score is not null
)
select
  pr.id            as user_id,
  pr.display_name  as name,
  coalesce(sum(ms.points), 0)::int as match_points,
  0::int as group_points,
  0::int as knockout_points,
  0::int as top_scorer_points,
  coalesce(sum(ms.points), 0)::int as points,
  coalesce(bool_or(pay.paid), false) as paid
from public.profiles pr
left join match_scores ms on ms.user_id = pr.id
left join public.payments pay on pay.user_id = pr.id
group by pr.id, pr.display_name;

grant select on public.leaderboard to anon, authenticated;
