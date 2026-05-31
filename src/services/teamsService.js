// Service-lager för lag.
//
// Reads from the `teams` table. The app's UI still imports the static helper
// `getTeamById` directly from `src/data/teams.js` for synchronous lookups —
// see the deferred follow-up in supabase/README.md. Once that refactor lands
// we'll drop those last static imports and `data/teams.js` along with them.

import { supabase, unwrap } from './supabaseClient.js';

function rowToTeam(r) {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    flag: r.flag,
    group: r.group,
  };
}

export async function fetchTeams() {
  const rows = unwrap(await supabase.from('teams').select('*'));
  return rows.map(rowToTeam);
}

export async function fetchGroups() {
  const rows = unwrap(
    await supabase.from('teams').select('group').order('group'),
  );
  return [...new Set(rows.map((r) => r.group))];
}

export async function fetchTeam(id) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToTeam(data) : null;
}

export async function fetchTeamsByGroup(group) {
  const rows = unwrap(
    await supabase.from('teams').select('*').eq('group', group),
  );
  return rows.map(rowToTeam);
}
