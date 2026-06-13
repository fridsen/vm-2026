import { predictionSign } from './signFromScore.js';

export function normalizeMatchPrediction(value) {
  if (!value || typeof value !== 'object') return value;
  const home =
    value.home != null && value.home !== '' ? Number(value.home) : null;
  const away =
    value.away != null && value.away !== '' ? Number(value.away) : null;
  return {
    ...value,
    home: Number.isFinite(home) ? home : value.home,
    away: Number.isFinite(away) ? away : value.away,
  };
}

function tipSuffix(sign, { homeTeam, awayTeam }, compact) {
  if (sign === 'X') return 'Oavgjort';
  if (sign === '1') {
    return compact ? homeTeam?.code ?? homeTeam?.id : homeTeam?.name;
  }
  if (sign === '2') {
    return compact ? awayTeam?.code ?? awayTeam?.id : awayTeam?.name;
  }
  return null;
}

/** "2-1 · Portugal" or "1-1 · Oavgjort" for match widgets. */
export function formatTipLabel(prediction, teams = {}, { compact = false } = {}) {
  if (!prediction) return null;
  const normalized = normalizeMatchPrediction(prediction);
  if (normalized.home == null || normalized.away == null) return null;

  const sign = predictionSign(normalized);
  const score = `${normalized.home}-${normalized.away}`;
  const suffix = tipSuffix(sign, teams, compact);
  return suffix ? `${score} · ${suffix}` : score;
}

/** "2-1 (1)" style label for list cards. */
export function formatMatchPredictionLabel(prediction) {
  if (!prediction) return null;
  const normalized = normalizeMatchPrediction(prediction);
  const sign = predictionSign(normalized);
  const score = `${normalized.home}-${normalized.away}`;
  return sign ? `${score} (${sign})` : score;
}
