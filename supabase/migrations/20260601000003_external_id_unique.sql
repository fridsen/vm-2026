-- sync-fixtures upserts on external_id; Postgres requires a matching unique
-- constraint. Nullable columns still allow multiple NULL rows.

alter table public.teams
  add constraint teams_external_id_key unique (external_id);

alter table public.matches
  add constraint matches_external_id_key unique (external_id);

alter table public.knockout_matches
  add constraint knockout_matches_external_id_key unique (external_id);

alter table public.players
  add constraint players_external_id_key unique (external_id);
