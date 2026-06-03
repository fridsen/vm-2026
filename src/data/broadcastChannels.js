import svtPlayLogo from '../assets/svt-play.png';
import tv4Logo from '../assets/tv4.png';
import { groupMatchScheduleForTeams } from './groupMatchSchedule.js';

const CHANNELS = {
  svt: {
    id: 'svt',
    label: 'SVT',
    logo: svtPlayLogo,
  },
  tv4: {
    id: 'tv4',
    label: 'TV4',
    logo: tv4Logo,
  },
};

function normalizeChannel(value) {
  if (!value) return null;
  const channel = String(value).toLowerCase();
  if (channel.includes('tv4') || channel.includes('4')) return CHANNELS.tv4;
  if (channel.includes('svt')) return CHANNELS.svt;
  return null;
}

export function broadcastForMatch(match) {
  const explicit = normalizeChannel(
    match?.broadcastChannel || match?.broadcast_channel || match?.channel || match?.tv_channel,
  );
  if (explicit) return explicit;

  const schedule = groupMatchScheduleForTeams(match?.homeTeamId, match?.awayTeamId);
  return normalizeChannel(schedule?.channel);
}
