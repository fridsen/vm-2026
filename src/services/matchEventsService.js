import { supabase, unwrap } from './supabaseClient.js';
import { rowToRevealEvent } from '../utils/matchEventMapping.js';

function sortEvents(rows) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchMatchEvents(matchId) {
  const rows = unwrap(
    await supabase
      .from('match_events')
      .select('minute, type, team_side, player_name, detail, sort_order')
      .eq('match_id', matchId)
      .order('sort_order'),
  );
  return sortEvents(rows).map(rowToRevealEvent);
}

export async function fetchEventsForMatches(matchIds) {
  if (!matchIds?.length) return {};

  const rows = unwrap(
    await supabase
      .from('match_events')
      .select('match_id, minute, type, team_side, player_name, detail, sort_order')
      .in('match_id', matchIds)
      .order('sort_order'),
  );

  const byId = {};
  for (const row of rows) {
    const list = byId[row.match_id] ?? [];
    list.push(row);
    byId[row.match_id] = list;
  }

  const result = {};
  for (const [matchId, matchRows] of Object.entries(byId)) {
    result[matchId] = sortEvents(matchRows).map(rowToRevealEvent);
  }
  return result;
}
