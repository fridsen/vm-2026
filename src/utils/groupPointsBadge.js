import { matchPointsBadgeColors } from './matchPointsBadge.js';

const PENDING_BADGE = {
  bg: 'var(--bg-container, #f0f5f9)',
  text: 'var(--text-tertiary, #a9b5c4)',
};

const ROW_CORRECT_BADGE = {
  bg: '#e8f8ee',
  text: '#3b9468',
};

const ROW_WRONG_BADGE = {
  bg: '#f9e7e8',
  text: '#751d18',
};

/** Badge colors for group-standing score (0–7). Reuses match tier palette. */
export function groupPointsBadgeColors(points) {
  const value = Math.max(0, Math.min(7, Math.round(Number(points) || 0)));
  if (value >= 7) return matchPointsBadgeColors(6);
  if (value >= 5) return matchPointsBadgeColors(4);
  if (value === 4) return matchPointsBadgeColors(4);
  if (value === 3) return matchPointsBadgeColors(3);
  if (value === 2) return matchPointsBadgeColors(2);
  if (value === 1) return matchPointsBadgeColors(1);
  return matchPointsBadgeColors(0);
}

export function formatGroupPointsLabel(group, points) {
  const value = Math.max(0, Math.round(Number(points) || 0));
  const pts = value === 1 ? '1 pt' : `${value} pts`;
  return `${group}: ${pts}`;
}

/** Per-position badge in player sheet: green = correct, red = wrong. */
export function groupRowPointsBadgeColors(points, finalized) {
  if (!finalized) return PENDING_BADGE;
  const value = Math.max(0, Math.round(Number(points) || 0));
  return value > 0 ? ROW_CORRECT_BADGE : ROW_WRONG_BADGE;
}

/** Total badge: tiered colors when finalized, grey while group is in progress. */
export function groupTotalPointsBadgeColors(points, finalized) {
  if (!finalized) return PENDING_BADGE;
  return groupPointsBadgeColors(points);
}
