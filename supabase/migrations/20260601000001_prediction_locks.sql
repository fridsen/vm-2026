-- Server-side lock enforcement. Mirrors src/utils/lockRules.js.
--
-- - Group-stage predictions (match, group_standing, top_scorers, final, finalists):
--   locked when the earliest match of the tournament has kicked off.
-- - Knockout per-round picks: locked when that round's first match has kicked off.
-- - Bronze: locked when bronze match has kicked off.
--
-- Apply this migration AFTER the prototype migration is verified. Once on,
-- nobody can edit picks past their respective deadline even if they hit the
-- API directly with a forged kickoff.

create or replace function public.fn_global_deadline()
returns timestamptz language sql stable as $$
  select min(kickoff) from public.matches;
$$;

create or replace function public.fn_round_deadline(p_round text)
returns timestamptz language sql stable as $$
  select min(kickoff) from public.knockout_matches where round = p_round;
$$;

create or replace function public.fn_round3_kickoff()
returns timestamptz language sql stable as $$
  select min(kickoff) from public.matches where round = 3;
$$;

-- Returns true if a prediction (kind, key) is still allowed to be written.
create or replace function public.fn_prediction_writable(p_kind text, p_key text)
returns boolean language plpgsql stable as $$
declare
  match_kickoff timestamptz;
  global_deadline timestamptz;
  round_deadline timestamptz;
begin
  case p_kind
    when 'match' then
      -- Per-spec the whole group phase locks at the first kickoff of the
      -- tournament. This is the same rule the client uses.
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;

    when 'group_standing' then
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;

    when 'top_scorers' then
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;

    when 'final' then
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;

    when 'finalists' then
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;

    when 'knockout_advance' then
      -- key is the knockout match id. Lock is at the first kickoff of that round.
      select kickoff into match_kickoff
        from public.knockout_matches where id = p_key;
      if match_kickoff is null then return false; end if;
      select public.fn_round_deadline(round) into round_deadline
        from public.knockout_matches where id = p_key;
      return round_deadline is null or now() < round_deadline;

    when 'bronze' then
      select public.fn_round_deadline('BRONZE') into round_deadline;
      return round_deadline is null or now() < round_deadline;

    else
      return false;
  end case;
end;
$$;

drop policy if exists "predictions write own" on public.predictions;

create policy "predictions insert own"
  on public.predictions
  for insert
  with check (
    auth.uid() = user_id
    and public.fn_prediction_writable(kind, key)
  );

create policy "predictions update own"
  on public.predictions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.fn_prediction_writable(kind, key)
  );

create policy "predictions delete own"
  on public.predictions
  for delete
  using (
    auth.uid() = user_id
    and public.fn_prediction_writable(kind, key)
  );
