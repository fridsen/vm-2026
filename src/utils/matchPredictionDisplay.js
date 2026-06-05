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

/** "2-1 (1)" style label for list cards. */
export function formatMatchPredictionLabel(prediction) {
  if (!prediction) return null;
  const normalized = normalizeMatchPrediction(prediction);
  const sign = predictionSign(normalized);
  const score = `${normalized.home}-${normalized.away}`;
  return sign ? `${score} (${sign})` : score;
}
