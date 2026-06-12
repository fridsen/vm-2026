// When live sync should call external APIs — based on known kickoffs + ET buffer.
// Kickoffs are fixed in our DB; we only poll providers during match windows.

/** Start polling before kickoff (lineups / early goals). */
export const PRE_MATCH_MS = 15 * 60 * 1000;

/** Keep polling after kickoff through ET + stoppage (matches finalize threshold). */
export const POST_MATCH_MS = 135 * 60 * 1000;

export type KickoffRow = { kickoff: string; status: string };

/** True when this fixture could be live or about to start. */
export function isInLiveSyncWindow(
  row: KickoffRow,
  now = Date.now(),
): boolean {
  if (row.status === 'in_play') return true;
  const kickoff = new Date(row.kickoff).getTime();
  if (Number.isNaN(kickoff)) return false;
  return now >= kickoff - PRE_MATCH_MS && now <= kickoff + POST_MATCH_MS;
}

/** Any group or knockout row in the live sync window? */
export function anyInLiveSyncWindow(
  rows: KickoffRow[],
  now = Date.now(),
): boolean {
  return rows.some((row) => isInLiveSyncWindow(row, now));
}
