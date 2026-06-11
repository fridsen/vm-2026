-- Close new signups at the same moment as the global tipping deadline
-- (first group-stage kickoff). Existing users can still log in.

create or replace function public.fn_registration_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_global_deadline() is null
      or now() < public.fn_global_deadline();
$$;

grant execute on function public.fn_registration_open() to anon, authenticated;

-- Auth hook: reject new auth.users rows after deadline (email + Google signup).
create or replace function public.hook_reject_signup_after_deadline(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.fn_registration_open() then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Anmälan är stängd. Tippningen låstes vid första avspark.',
        'http_code', 403
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

grant execute
  on function public.hook_reject_signup_after_deadline(jsonb)
  to supabase_auth_admin;

revoke execute
  on function public.hook_reject_signup_after_deadline(jsonb)
  from authenticated, anon, public;

-- Belt-and-suspenders: block profile creation for new accounts after deadline.
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (
    auth.uid() = id
    and public.fn_registration_open()
  );

comment on function public.fn_registration_open() is
  'True until fn_global_deadline(); used by signup UI and auth hook.';

comment on function public.hook_reject_signup_after_deadline(jsonb) is
  'before-user-created auth hook: block new accounts after tipping deadline.';
