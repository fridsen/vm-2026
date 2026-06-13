import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export function formatGroupRoundLabel(match) {
  const group = match?.group ? `Grupp ${match.group}` : null;
  const round = match?.round != null ? `Runda ${match.round}` : null;
  if (group && round) return `${group} · ${round}`;
  if (group) return group;
  if (round) return round;
  return match?.label ?? '';
}

export function formatGroupDateLabel(match) {
  const group = match?.group ? `Grupp ${match.group}` : null;
  const date = match?.kickoff
    ? format(new Date(match.kickoff), 'd MMMM', { locale: sv })
    : null;
  if (group && date) return `${group} · ${date}`;
  if (group) return group;
  if (date) return date;
  return match?.label ?? '';
}
