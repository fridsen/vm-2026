// Service-lager för lag — reads from the `teams` table.
//
// Static `src/data/teams.js` is kept only as a flag/group fallback until the
// sync function writes those fields itself.

import { teams as staticTeams } from '../data/teams.js';
import { flagForCode } from '../data/flags.js';
import { swedishNameForCode } from '../data/teamNames.js';
import { supabase, unwrap } from './supabaseClient.js';

const staticById = new Map(staticTeams.map((t) => [t.id, t]));

function rowToTeam(r) {
  const fallback = staticById.get(r.id);
  const code = r.code ?? r.id;
  return {
    id: r.id,
    name: swedishNameForCode(code) ?? r.name,
    code,
    flag: r.flag ?? fallback?.flag ?? flagForCode(code),
    group: r.group !== '?' ? r.group : (fallback?.group ?? r.group),
  };
}

/** Unique team ids participating in a group's fixtures. */
export function teamIdsInGroup(group, matches) {
  const ids = new Set();
  for (const m of matches) {
    if (m.group !== group) continue;
    ids.add(m.homeTeamId);
    ids.add(m.awayTeamId);
  }
  return [...ids];
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
