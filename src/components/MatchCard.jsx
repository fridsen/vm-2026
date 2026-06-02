import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import ScoreInput from './ScoreInput.jsx';
import LockBadge from './LockBadge.jsx';
import { STATE } from '../utils/lockRules.js';
import { useTeams } from '../hooks/useTeams.js';

function TeamBlock({ teamId, align = 'left' }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);
  if (!team) {
    return (
      <div
        className={`flex items-center gap-2 ${
          align === 'right' ? 'flex-row-reverse text-right' : ''
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          ?
        </div>
        <div className="text-sm font-semibold text-neutral-500">TBD</div>
      </div>
    );
  }
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-2xl ring-1 ring-neutral-200/80 shadow-inner">
        <span aria-hidden>{team.flag}</span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-900">{team.name}</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          {team.code}
        </div>
      </div>
    </div>
  );
}

export default function MatchCard({ match, prediction, onChange, lockState }) {
  const locked = lockState === STATE.LOCKED;
  const kickoff = new Date(match.kickoff);
  const dateLabel = format(kickoff, 'EEE d MMM', { locale: sv });
  const timeLabel = format(kickoff, 'HH:mm', { locale: sv });

  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="chip bg-neutral-100 text-neutral-700 ring-neutral-200">
          Grupp {match.group} · R{match.round}
        </span>
        <div className="flex items-center gap-2 text-neutral-500">
          <span className="capitalize">{dateLabel}</span>
          <span className="text-neutral-300">·</span>
          <span className="font-semibold text-neutral-800">{timeLabel}</span>
          <LockBadge state={lockState} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock teamId={match.homeTeamId} />
        <ScoreInput
          home={prediction?.home ?? ''}
          away={prediction?.away ?? ''}
          onChange={(v) => onChange?.(v)}
          disabled={locked}
          compact
        />
        <TeamBlock teamId={match.awayTeamId} align="right" />
      </div>
    </div>
  );
}
