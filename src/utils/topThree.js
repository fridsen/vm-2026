/** VM podium: ordered [gold, silver, bronze] team ids. */

export function normalizeTopThree(value) {
  if (Array.isArray(value)) {
    return [value[0] || null, value[1] || null, value[2] || null];
  }
  if (typeof value === 'string' && value) {
    return [value, null, null];
  }
  return [null, null, null];
}

export function getTopThree(predictions) {
  const raw = predictions?.knockout?.topThree ?? predictions?.knockout?.FINAL;
  return normalizeTopThree(raw);
}

export function countTopThreeFilled(topThree) {
  return normalizeTopThree(topThree).filter(Boolean).length;
}

export function toggleTopThree(topThree, teamId) {
  const slots = normalizeTopThree(topThree);
  const idx = slots.findIndex((id) => id === teamId);
  if (idx !== -1) {
    const next = [...slots];
    next[idx] = null;
    return next;
  }
  const emptyIdx = slots.findIndex((id) => !id);
  if (emptyIdx === -1) return slots;
  const next = [...slots];
  next[emptyIdx] = teamId;
  return next;
}

export function sortTeamsForPodium(teams, topThree) {
  const slots = normalizeTopThree(topThree);
  const rankedIds = slots.filter(Boolean);
  const ranked = rankedIds
    .map((id) => teams.find((t) => t.id === id))
    .filter(Boolean);
  const rest = teams
    .filter((t) => !rankedIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  return [...ranked, ...rest];
}
