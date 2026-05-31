// Service-lager för spelare och skytteliga.

import { supabase, unwrap } from './supabaseClient.js';

function rowToPlayer(r) {
  return {
    id: r.id,
    name: r.name,
    teamCode: r.team_code,
    position: r.position,
  };
}

export async function fetchPlayers() {
  const rows = unwrap(await supabase.from('players').select('*').order('name'));
  return rows.map(rowToPlayer);
}

export async function fetchTopScorers() {
  const rows = unwrap(
    await supabase
      .from('topscorers')
      .select('player_id, goals, assists, cards, position, players(*)')
      .order('position', { ascending: true, nullsFirst: false })
      .order('goals', { ascending: false }),
  );
  return rows.map((r) => ({
    ...rowToPlayer(r.players),
    goals: r.goals,
    assists: r.assists,
    cards: r.cards,
    position: r.position,
  }));
}
