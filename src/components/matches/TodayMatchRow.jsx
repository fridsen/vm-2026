import { useMemo } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import MatchPointsBadge from '../MatchPointsBadge.jsx';
import { useTeams } from '../../hooks/useTeams.js';
import { formatTipLabel } from '../../utils/matchPredictionDisplay.js';
import { scoreGroupMatch } from '../../utils/scoring.js';
import {
  MATCH_STATE,
  displayScore,
  getMatchState,
} from '../../utils/matchSchedule.js';

function TeamCode({ teamId, muted }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);

  return (
    <div className={clsx('today-match-team', muted && 'is-muted')}>
      <span className="today-match-code">{team?.code ?? '?'}</span>
      <span className="today-match-flag" aria-hidden>
        {team?.flag ?? '?'}
      </span>
    </div>
  );
}

export default function TodayMatchRow({
  match,
  now,
  prediction,
  /** Leaderboard sheet: show tip pill alongside points for finished matches. */
  showTipWithPoints = false,
}) {
  const { getTeamById } = useTeams();
  const state = getMatchState(match, now);
  const kickoff = new Date(match.kickoff);
  const scoreLine = displayScore(match);
  const isFinished = state === MATCH_STATE.FINISHED;
  const isUpcoming = state === MATCH_STATE.UPCOMING;

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const tipLabel = formatTipLabel(prediction, { homeTeam, awayTeam }, { compact: true });

  const pointsEarned = useMemo(() => {
    if (!isFinished || !match.result || !prediction) return null;
    return scoreGroupMatch(prediction, match.result).points;
  }, [isFinished, match.result, prediction]);

  const centerValue = isUpcoming
    ? format(kickoff, 'HH:mm', { locale: sv })
    : scoreLine != null
      ? `${scoreLine.home}-${scoreLine.away}`
      : '–';

  const showPoints = isFinished && pointsEarned != null;
  const showTip = Boolean(tipLabel) && (!isFinished || showTipWithPoints);

  return (
    <div className={clsx('today-match-row', isFinished && 'is-finished')}>
      <div className="today-match-main">
        <div className="today-match-teams">
          <TeamCode teamId={match.homeTeamId} muted={isFinished} />
          <span
            className={clsx(
              'today-match-center',
              isUpcoming && 'is-time',
              isFinished && 'is-muted',
            )}
          >
            {centerValue}
          </span>
          <div className="today-match-team today-match-team--away">
            <span className={clsx('today-match-flag', isFinished && 'is-muted')} aria-hidden>
              {awayTeam?.flag ?? '?'}
            </span>
            <span className={clsx('today-match-code', isFinished && 'is-muted')}>
              {awayTeam?.code ?? '?'}
            </span>
          </div>
        </div>

        <div className="today-match-status">
          {showTip ? (
            <span className="today-match-badge today-match-badge--tip">{tipLabel}</span>
          ) : null}
          {showPoints ? (
            <MatchPointsBadge points={pointsEarned} className="today-match-badge" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
