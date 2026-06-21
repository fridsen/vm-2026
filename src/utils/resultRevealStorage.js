export const RESULT_REVEAL_SEEN_KEY = 'vm2026:resultRevealSeen:v1';

export function resultRevealStorageKey(userId) {
  return userId ? `${RESULT_REVEAL_SEEN_KEY}:${userId}` : RESULT_REVEAL_SEEN_KEY;
}

function readRaw(userId) {
  if (!userId) return [];
  try {
    const raw = globalThis.localStorage?.getItem(resultRevealStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeRaw(userId, ids) {
  if (!userId) return;
  try {
    globalThis.localStorage?.setItem(
      resultRevealStorageKey(userId),
      JSON.stringify([...new Set(ids)]),
    );
  } catch {
    /* ignore unavailable storage */
  }
}

export function readSeenMatchIds(userId) {
  return new Set(readRaw(userId));
}

export function isMatchSeen(userId, matchId) {
  if (!userId || !matchId) return false;
  return readSeenMatchIds(userId).has(matchId);
}

export function markMatchSeen(userId, matchId) {
  if (!userId || !matchId) return readSeenMatchIds(userId);
  const next = readSeenMatchIds(userId);
  next.add(matchId);
  writeRaw(userId, next);
  return next;
}

export function clearSeenMatchIds(userId) {
  if (!userId) return new Set();
  writeRaw(userId, []);
  return new Set();
}
