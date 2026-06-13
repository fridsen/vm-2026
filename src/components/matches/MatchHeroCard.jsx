import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import { useTeams } from '../../hooks/useTeams.js';
import { emblemForCode } from '../../data/emblems.js';
import { broadcastForMatch } from '../../data/broadcastChannels.js';
import { formatTipLabel } from '../../utils/matchPredictionDisplay.js';
import { formatGroupDateLabel, formatGroupRoundLabel } from '../../utils/matchMetaDisplay.js';
import {
  MATCH_STATE,
  displayScore,
  getMatchState,
} from '../../utils/matchSchedule.js';

function TeamBlock({ teamId, className }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);
  const emblem = team ? emblemForCode(team.code) : null;

  return (
    <div className={clsx('match-hero-team', className)}>
      <div className="match-hero-emblem">
        {emblem ? (
          <img src={emblem} alt="" />
        ) : (
          <span aria-hidden>{team?.flag ?? '?'}</span>
        )}
      </div>
      <p className="match-hero-team-name">{team?.name ?? 'TBD'}</p>
    </div>
  );
}

function FooterBadge({ variant, pointsEarned }) {
  if (variant === 'live') {
    return <span className="match-hero-badge match-hero-badge--live">LIVE</span>;
  }

  if (pointsEarned != null) {
    return (
      <span className="match-hero-badge match-hero-badge--points">
        {pointsEarned} Poäng
      </span>
    );
  }

  return null;
}

export default function MatchHeroCard({
  match,
  now = Date.now(),
  variant,
  prediction,
  pointsEarned,
  className,
}) {
  const { getTeamById } = useTeams();
  const state = getMatchState(match, now);
  const resolvedVariant =
    variant ??
    (state === MATCH_STATE.LIVE
      ? 'live'
      : state === MATCH_STATE.UPCOMING
        ? 'upcoming'
        : 'finished');

  const kickoff = new Date(match.kickoff);
  const channel = broadcastForMatch(match);
  const scoreLine = displayScore(match);
  const awaitingScore = resolvedVariant === 'live' && scoreLine == null;
  const score =
    scoreLine != null
      ? `${scoreLine.home} - ${scoreLine.away}`
      : awaitingScore
        ? '–'
        : null;

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const tipLabel = formatTipLabel(prediction, { homeTeam, awayTeam });

  const metaLabel =
    resolvedVariant === 'live'
      ? formatGroupRoundLabel(match)
      : resolvedVariant === 'upcoming'
        ? formatGroupDateLabel(match)
        : 'Match slut';

  const pillIsTime = resolvedVariant === 'upcoming';
  const pillValue = pillIsTime ? format(kickoff, 'HH:mm', { locale: sv }) : score;
  const pillMuted =
    resolvedVariant === 'finished' || resolvedVariant === 'recent-finished';

  const showChannel = resolvedVariant === 'upcoming' && channel;
  const showFooterBadge =
    resolvedVariant === 'live' || pointsEarned != null;

  return (
    <div className={clsx('match-hero-card', className)}>
      <div className="match-hero-body">
        <TeamBlock teamId={match.homeTeamId} className="match-hero-team--home" />

        <div className="match-hero-center">
          <p className="match-hero-meta">{metaLabel}</p>
          {pillValue != null && (
            <div
              className={clsx(
                'match-hero-pill',
                pillMuted && 'match-hero-pill--muted',
              )}
            >
              <span className="match-hero-pill-value">{pillValue}</span>
            </div>
          )}
        </div>

        <TeamBlock teamId={match.awayTeamId} className="match-hero-team--away" />
      </div>

      {(tipLabel || showFooterBadge || showChannel) && (
        <div className="match-hero-footer">
          {tipLabel ? (
            <p className="match-hero-prediction">
              <span>Ditt tips: </span>
              <strong>{tipLabel}</strong>
            </p>
          ) : (
            <span />
          )}

          <div className="match-hero-footer-status">
            {showFooterBadge && (
              <FooterBadge variant={resolvedVariant} pointsEarned={pointsEarned} />
            )}
            {showChannel && (
              <div
                className={clsx('match-hero-channel', `is-${channel.id}`)}
                aria-label={`Sänds på ${channel.label}`}
              >
                <img src={channel.logo} alt={channel.label} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
