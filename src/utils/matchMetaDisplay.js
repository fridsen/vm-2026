import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { isKnockoutMatch } from './matchSchedule.js';

const KNOCKOUT_ROUND_LABELS = {
  R32: 'Sextondelsfinal',
  R16: 'Åttondelsfinal',
  QF: 'Kvartsfinal',
  SF: 'Semifinal',
  BRONZE: 'Bronsmatch',
  FINAL: 'Final',
};

function formatRoundLabel(match) {
  if (typeof match?.round === 'string') {
    return KNOCKOUT_ROUND_LABELS[match.round] ?? match.label ?? match.round;
  }
  if (match?.round != null) return `Runda ${match.round}`;
  return match?.label ?? '';
}

export function formatGroupRoundLabel(match) {
  const group = match?.group ? `Grupp ${match.group}` : null;
  const round = formatRoundLabel(match) || null;
  if (group && round) return `${group} · ${round}`;
  if (group) return group;
  if (round) return round;
  return match?.label ?? '';
}

export function formatGroupDateLabel(match) {
  const group = match?.group ? `Grupp ${match.group}` : null;
  const round = isKnockoutMatch(match) ? formatRoundLabel(match) : null;
  const date = match?.kickoff
    ? format(new Date(match.kickoff), 'd MMMM', { locale: sv })
    : null;
  if (group && date) return `${group} · ${date}`;
  if (round && date) return `${round} · ${date}`;
  if (group) return group;
  if (round) return round;
  if (date) return date;
  return match?.label ?? '';
}
