/** @typedef {{ bg: string, text: string }} MatchPointsBadgeColors */

const TIERS = {
  0: { bg: '#F1EFE8', text: '#5F5E5A' },
  1: { bg: '#FAECE7', text: '#993C1D' },
  2: { bg: '#FAEEDA', text: '#854F0B' },
  3: { bg: '#E6F1FB', text: '#185FA5' },
  4: { bg: '#E1F5EE', text: '#0F6E56' },
  6: { bg: '#EAF3DE', text: '#3B6D11' },
};

/** Badge colors for earned match points (0–6; totals above 6 use the 6-pt tier). */
export function matchPointsBadgeColors(points) {
  const raw = Math.max(0, Math.round(Number(points) || 0));
  const value = Math.min(6, raw);
  if (value === 5) return TIERS[4];
  return TIERS[value] ?? TIERS[0];
}

/** Human-readable badge label, e.g. `3 pts` or `1 pt`. */
export function formatMatchPointsLabel(points) {
  const value = Math.max(0, Math.round(Number(points) || 0));
  return value === 1 ? '1 pt' : `${value} pts`;
}

/** Compound label for same-kickoff matches, e.g. `4 + 2 pts`. */
export function formatMatchPointsPartsLabel(parts) {
  const values = (parts ?? []).map((p) => Math.max(0, Math.round(Number(p) || 0)));
  if (values.length === 0) return '';
  if (values.length === 1) return formatMatchPointsLabel(values[0]);
  return `${values.join(' + ')} pts`;
}

/** Sum of per-match points in a same-kickoff slot. */
export function matchPointsPartsTotal(parts) {
  return (parts ?? []).reduce(
    (sum, value) => sum + Math.max(0, Math.round(Number(value) || 0)),
    0,
  );
}
