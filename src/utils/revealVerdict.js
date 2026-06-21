import { scoreGroupMatch } from './scoring.js';

export function revealVerdict(prediction, actual) {
  const { breakdown } = scoreGroupMatch(prediction, actual);
  if (breakdown.exact === 1) return 'Exakt rätt!';
  if (breakdown.sign === 3) return 'Rätt tecken';
  return 'Fel tecken';
}
