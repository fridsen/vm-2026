import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import { useTeams } from '../../hooks/useTeams.js';
import { emblemForCode } from '../../data/emblems.js';
import { broadcastForMatch } from '../../data/broadcastChannels.js';
import {
  MATCH_STATE,
  displayScore,
  getMatchState,
  liveMatchMinute,
} from '../../utils/matchSchedule.js';

function TeamBlock({ teamId }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);
  const emblem = team ? emblemForCode(team.code) : null;

  return (
    <div className="live-match-team">
      <div className="live-match-emblem">
        {emblem ? (
          <img src={emblem} alt="" />
        ) : (
          <span aria-hidden>{team?.flag ?? '?'}</span>
        )}
      </div>
      <p className="live-match-team-name">{team?.name ?? 'TBD'}</p>
    </div>
  );
}

export default function LiveMatchCarouselCard({ match, now, single }) {
  const state = getMatchState(match, now);
  const kickoff = new Date(match.kickoff);
  const channel = broadcastForMatch(match);
  const scoreLine = displayScore(match);
  const score = scoreLine != null ? `${scoreLine.home} - ${scoreLine.away}` : null;

  return (
    <Link
      to="/matcher"
      className={clsx(
        'live-match-card',
        state === MATCH_STATE.LIVE && 'live-match-card--live',
        state === MATCH_STATE.UPCOMING && 'live-match-card--upcoming',
        state === MATCH_STATE.FINISHED && 'live-match-card--finished',
        single && 'live-match-card--single',
      )}
    >
      <div className="live-match-score">
        <TeamBlock teamId={match.homeTeamId} />

        <div className="live-match-center">
          {state === MATCH_STATE.UPCOMING ? (
            <>
              <p className="live-match-meta">
                GRUPP {match.group}
              </p>
              <p className="live-match-date">
                {format(kickoff, 'EEE d MMM', { locale: sv }).toUpperCase()}
              </p>
              <p className="live-match-time">{format(kickoff, 'HH:mm', { locale: sv })}</p>
              {channel && (
                <div className={`live-match-channel is-${channel.id}`}>
                  <img src={channel.logo} alt={channel.label} />
                </div>
              )}
            </>
          ) : (
            <>
              <p className="live-match-meta">Grupp {match.group}</p>
              <p className="live-match-scoreline">{score}</p>
              {state === MATCH_STATE.LIVE ? (
                <div className="live-match-badge live-match-badge--live">
                  <span>LIVE</span>
                  <span>{liveMatchMinute(match, now)}&apos;</span>
                </div>
              ) : (
                <div className="live-match-badge live-match-badge--ft">FULLTID</div>
              )}
            </>
          )}
        </div>

        <TeamBlock teamId={match.awayTeamId} />
      </div>
    </Link>
  );
}
