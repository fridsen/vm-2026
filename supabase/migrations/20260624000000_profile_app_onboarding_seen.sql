-- Persist in-app onboarding completion on the profile so it survives iOS
-- "Add to Home Screen" (Safari and standalone use separate localStorage).

alter table public.profiles
  add column if not exists app_onboarding_seen boolean not null default false;

comment on column public.profiles.app_onboarding_seen is
  'True after the user finishes the 6-step home-screen onboarding tour.';
