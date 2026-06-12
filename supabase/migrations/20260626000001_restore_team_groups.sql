-- football-data team sync overwrote group letters with '?' (provider has no group field).
-- Derive correct WC groups from group-stage fixtures so fn_computed_group_standing works.

update public.teams t
set "group" = sub.grp
from (
  select distinct on (team_id) team_id, grp
  from (
    select m.home_team_id as team_id, m."group" as grp from public.matches m
    union all
    select m.away_team_id, m."group" from public.matches m
  ) pairs
  where grp is not null and grp <> '?'
  order by team_id, grp
) sub
where t.id = sub.team_id
  and (t."group" is null or t."group" = '?');
