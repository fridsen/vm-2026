import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTeams } from '../hooks/useTeams.js';
import { emblemForCode } from '../data/emblems.js';
import { broadcastForMatch } from '../data/broadcastChannels.js';

function TeamBlock({ teamId }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);
  const emblem = team ? emblemForCode(team.code) : null;

  if (!team) {
    return (
      <div className="match-card-team">
        <div className="match-card-emblem">?</div>
        <div className="match-card-team-name">TBD</div>
      </div>
    );
  }

  return (
    <div className="match-card-team">
      <div className="match-card-emblem">
        {emblem ? <img src={emblem} alt="" /> : <span aria-hidden>{team.flag}</span>}
      </div>
      <div className="match-card-team-name">{team.name}</div>
    </div>
  );
}

function predictionOutcome(prediction) {
  if (!prediction) return null;
  if (prediction.home > prediction.away) return '1';
  if (prediction.home < prediction.away) return '2';
  return 'X';
}

export default function MatchCard({ match, prediction, onPredict }) {
  const kickoff = new Date(match.kickoff);
  const channel = broadcastForMatch(match);
  const outcome = predictionOutcome(prediction);
  const dateLabel = format(kickoff, 'EEE d MMMM', { locale: sv }).toUpperCase();

  return (
    <button
      type="button"
      className={prediction ? 'match-card stagger-child has-prediction' : 'match-card stagger-child'}
      onClick={onPredict}
      disabled={!onPredict}
    >
      <div className="match-card-score">
        <TeamBlock teamId={match.homeTeamId} />

        <div className="match-card-center">
          <div className="match-card-group">Grupp {match.group}</div>
          <div className="match-card-date">{dateLabel}</div>
          <div className="match-card-time">{format(kickoff, 'HH:mm', { locale: sv })}</div>
          {channel && (
            <div
              className={`match-card-channel is-${channel.id}`}
              aria-label={`Sänds på ${channel.label}`}
            >
              <img src={channel.logo} alt={channel.label} />
            </div>
          )}
        </div>

        <TeamBlock teamId={match.awayTeamId} />
      </div>

      {prediction && (
        <div className="match-card-prediction">
          Din tippning {prediction.home}-{prediction.away}
          {outcome && (
            <>
              <span aria-hidden> · </span>
              <span>({outcome})</span>
            </>
          )}
        </div>
      )}
    </button>
  );
}
