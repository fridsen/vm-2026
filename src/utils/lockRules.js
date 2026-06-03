// Låsregler för tippning.
//
// Globalt lås: När första gruppspelsmatchen sparkas igång låses match,
// gruppslutställning och VM-vinnare (match, group_standing, final).

export const STATE = {
  NOT_AVAILABLE: 'not_available',
  OPEN: 'open',
  LOCKED: 'locked',
};

export function getGlobalDeadline(matches) {
  if (!matches || matches.length === 0) return null;
  return matches.reduce((earliest, m) => {
    if (!earliest) return m.kickoff;
    return m.kickoff < earliest ? m.kickoff : earliest;
  }, null);
}

export function isTournamentLocked(now, matches) {
  const deadline = getGlobalDeadline(matches);
  if (!deadline) return false;
  return new Date(now) >= new Date(deadline);
}

/** @deprecated use isTournamentLocked */
export function isGroupPhaseLocked(now, matches) {
  return isTournamentLocked(now, matches);
}

export function getMatchLockState(now, matches) {
  return isTournamentLocked(now, matches) ? STATE.LOCKED : STATE.OPEN;
}

export function msUntil(deadline, now = Date.now()) {
  if (!deadline) return null;
  return new Date(deadline).getTime() - new Date(now).getTime();
}

export function formatCountdown(ms) {
  if (ms == null) return '–';
  if (ms <= 0) return 'Låst';
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}
