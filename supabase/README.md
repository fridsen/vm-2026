# Supabase backend

Migrations, Edge Functions and the seed script for the Supabase-backed
production version of VM-2026. The plan in
`/Users/jimmy/.cursor/plans/vm-2026_go_live_b43f959a.plan.md` describes the
full cutover. This file is the operational checklist.

## Auth providers

The onboarding flow (signup / login / payment) supports email+password and
Google. Configure both in the Dashboard (Authentication → Providers):

- Enable the Google provider; set its Authorized redirect URI to
  `https://<ref>.supabase.co/auth/v1/callback` and add your site origins under
  Authentication → URL Configuration.

### Local dev (stop OAuth sending you to production)

In the **hosted** Supabase project (Dashboard → **Authentication** → **URL Configuration**):

1. **Site URL** — keep production, e.g. `https://vm-2026-seven.vercel.app`
2. **Redirect URLs** — add every origin you dev on, for example:
   - `http://localhost:5173`
   - `http://localhost:5173/**`
   - `http://127.0.0.1:5173`
   - Your LAN URL if you test on a phone, e.g. `http://192.168.1.10:5173/**`

If localhost is missing, Google login completes but Supabase sends you to **Site URL** (Vercel) instead of your dev server.

The app passes `redirectTo` from `getAuthRedirectUrl()` (`src/utils/authRedirect.js`) — usually `window.location.origin`. Optional override: `VITE_SITE_URL` in `.env.local`.
- For email signup to drop the user straight into the app (the design has no
  "confirm your email" step), turn OFF "Confirm email" under
  Authentication → Providers → Email. If it stays ON, signup instead shows a
  "kolla din mejl" message and the user must confirm before the session exists.

## One-time setup

1. Create the Supabase project (free tier is enough).
2. Install the CLI:
   ```bash
   brew install supabase/tap/supabase
   supabase login
   supabase link --project-ref <ref>
   ```
3. Push the schema and prediction-lock migrations (includes `20260608000001_security_ops.sql`):
   ```bash
   supabase db push
   ```
4. Deploy admin Edge Functions (after secrets below):
   ```bash
   supabase functions deploy send-payment-reminder
   supabase functions deploy snapshot-predictions
   ```
   Secrets for reminders: `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, optional `ENTRY_FEE_SEK`, `SWISH_NUMBER`.
5. Verify locks: run `scripts/verify-prediction-locks.sql` in the SQL editor.
6. **Deadline signup lock** (`20260610220000_registration_lock.sql`): after first
   kickoff, new accounts are blocked. Enable the auth hook in the Dashboard:
   **Authentication → Hooks → before-user-created** → Postgres function
   `hook_reject_signup_after_deadline`. Local dev picks this up from
   `supabase/config.toml`. Verify with `select public.fn_registration_open();`
   (should be `false` after deadline).
6. Set Edge Function secrets:
   ```bash
   supabase secrets set \
     FOOTBALL_PROVIDER=football-data \
     FOOTBALL_DATA_API_KEY=...           # or API_FOOTBALL_KEY
   ```
7. Deploy the sync function:
   ```bash
   supabase functions deploy sync-fixtures
   ```
8. Configure cron secrets in the Dashboard
   (Database → Database Settings → Custom Config):
   ```
   app.functions_base_url = https://<ref>.supabase.co/functions/v1
   app.cron_secret        = <service role key or a random shared secret>
   ```
   Then run the cron migration to schedule the sync every 10 minutes:
   ```bash
   supabase db push    # idempotent
   ```

## Cutover sequence

These mirror the plan's todo list. Step 8 (final cleanup) has been applied
to the codebase already, so a fresh deploy goes straight from step 1 to
step 7. The intermediate "VITE_USE_SUPABASE flag + mock fallbacks" phase
described in the plan only existed during the cutover and has been removed.

1. **Schema only.** Apply `20260601000000_initial_schema.sql`. RLS for
   predictions is owner-can-do-anything at this point — locks come later.
2. **Sync against a finished friendly tournament.** Set
   `FOOTBALL_PROVIDER` / endpoints to point at a closed competition the
   provider exposes (e.g. WC 2022) by editing the `COMPETITION` constant in
   `supabase/functions/_shared/providers/footballData.ts` (or `LEAGUE` /
   `SEASON` in `apiFootball.ts`). Confirm scores, status, and topscorers
   populate. Verify the leaderboard view returns correct match points.
3. **Point at WC 2026.** Restore the WC 2026 ids and re-deploy the
   function. Run it manually once with `npm run supabase:sync`.
4. **Turn on lock enforcement.** Apply
   `20260601000001_prediction_locks.sql`. From this point predictions cannot
   be edited past their respective deadlines, even by direct API calls.
5. **Schedule the cron.** Apply `20260601000002_sync_cron.sql`. The function
   now runs every 10 minutes.

## Entry-fee / payment tracking (Level 2, manual Swish)

Migration `20260601000003_payments.sql` adds a `payments` table, an `admins`
email allowlist, and an `is_admin()` function. Players pay the entry fee
manually in Swish; an admin marks them as paid from the Topplista page. The
status is informational only — it never blocks tipping.

Setup:

1. Apply the migration (`npm run supabase:push`).
2. Add yourself as an admin — Table Editor → `admins` → insert a row with the
   email you sign in with:
   ```sql
   insert into public.admins (email) values ('you@example.com');
   ```
3. Set the pay-in instructions shown to players (not secret) in the client
   env — `.env.local` locally and the host's env vars in production:
   ```env
   VITE_SWISH_NUMBER=123 456 78 90
   VITE_ENTRY_FEE_SEK=100
   ```

Admins use **Profil → Admin** links to `/admin/betalningar` (unpaid list,
mark paid, send reminders) and `/admin/tipphistorik` (prediction audit).
The allowlist stays in the `admins` table.

## Match analysis (hardcoded)

The prediction sheet's match previews are curated, hardcoded Swedish text in
`src/data/matchAnalysis.js`, matched to each fixture by the two team codes.
There is no AI/LLM call and no backend involved. The earlier shared-cache
table (`match_analysis`) was dropped in
`20260601000006_drop_match_analysis.sql`.

## Deferred follow-up

The UI still imports a handful of synchronous helpers
(`getTeamById`, `GROUPS`, `getTeamsByGroup`) directly from
`src/data/teams.js`. That file is kept as a static metadata bundle for now —
the mock fixtures, players, leaderboard, and predictions have all been
removed. Fully eliminating `src/data/teams.js` requires a small client-side
teams cache (one `fetchTeams()` on app boot, shared via context) so the four
UI sites can keep their synchronous `getTeamById`-style call shape.

## Manual sync

```bash
curl -X POST \
  https://<ref>.supabase.co/functions/v1/sync-fixtures \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Response is JSON with `ok`, counts per table, and `durationMs`.
