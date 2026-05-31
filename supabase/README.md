# Supabase backend

Migrations, Edge Functions and the seed script for the Supabase-backed
production version of VM-2026. The plan in
`/Users/jimmy/.cursor/plans/vm-2026_go_live_b43f959a.plan.md` describes the
full cutover. This file is the operational checklist.

## One-time setup

1. Create the Supabase project (free tier is enough).
2. Install the CLI:
   ```bash
   brew install supabase/tap/supabase
   supabase login
   supabase link --project-ref <ref>
   ```
3. Push the schema and prediction-lock migrations:
   ```bash
   supabase db push
   ```
4. Set Edge Function secrets:
   ```bash
   supabase secrets set \
     FOOTBALL_PROVIDER=football-data \
     FOOTBALL_DATA_API_KEY=...           # or API_FOOTBALL_KEY
   ```
5. Deploy the sync function:
   ```bash
   supabase functions deploy sync-fixtures
   ```
6. Configure cron secrets in the Dashboard
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

## Deferred follow-up

The UI still imports a handful of synchronous helpers
(`getTeamById`, `GROUPS`, `getTeamsByGroup`) directly from
`src/data/teams.js`, plus team-context strings from
`src/data/teamProfiles.js`. Those two files are kept as static
metadata bundles for now — the mock fixtures, players, leaderboard, and
predictions have all been removed. Fully eliminating `src/data/` requires:

- A small client-side teams cache (one `fetchTeams()` on app boot,
  shared via context) so the four UI sites can keep their synchronous
  `getTeamById`-style call shape.
- Moving `teamProfiles` either into the `teams` table as a `style` /
  `identity` column pair or into the LLM service as static config.

## Manual sync

```bash
curl -X POST \
  https://<ref>.supabase.co/functions/v1/sync-fixtures \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Response is JSON with `ok`, counts per table, and `durationMs`.
