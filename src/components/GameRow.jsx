import clsx from 'clsx';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { getTeamById } from '../data/teams.js';
import { MATCH_STATE, getMatchState } from '../utils/matchSchedule.js';

function TeamRow({ teamId, loser }) {
  const team = getTeamById(teamId);
  return (
    <div className="gr-team-row">
      <span className="gr-flag" aria-hidden>
        {team?.flag ?? '🏳'}
      </span>
      <span className={clsx('gr-team-name', loser && 'loser')}>{team?.name ?? 'TBD'}</span>
    </div>
  );
}

/**
 * GameRow — Skorio-style: teams stacked left, score or time/predict stacked right.
 *
 * Props:
 *  - match: { id, kickoff, homeTeamId, awayTeamId, result }
 *  - now: ms timestamp for state calc
 *  - prediction: { home, away } | undefined
 *  - predictionPoints: number | undefined
 *  - onPredict: () => void  (handler to open predict UI)
 */
export default function GameRow({ match, now, prediction, predictionPoints, onPredict }) {
  const state = getMatchState(match, now);
  const kickoff = new Date(match.kickoff);
  const isFinished = state === MATCH_STATE.FINISHED;
  const isLive = state === MATCH_STATE.LIVE;
  const isUpcoming = state === MATCH_STATE.UPCOMING;

  const homeScore = match.result?.home;
  const awayScore = match.result?.away;
  const homeLoser =
    isFinished && match.result && match.result.home < match.result.away;
  const awayLoser =
    isFinished && match.result && match.result.away < match.result.home;

  const handleClick = (e) => {
    if (isUpcoming) {
      e.preventDefault();
      onPredict?.();
    }
  };

  return (
    <div className="game-row stagger-child" onClick={handleClick}>
      <div className="gr-body">
        <div className="gr-teams">
          <TeamRow teamId={match.homeTeamId} loser={homeLoser} />
          <TeamRow teamId={match.awayTeamId} loser={awayLoser} />
        </div>

        <div className="gr-right">
          {isFinished && match.result && (
            <>
              <div className="gr-scores">
                <div className={clsx('gr-score-num', homeLoser && 'loser')}>{homeScore}</div>
                <div className={clsx('gr-score-num', awayLoser && 'loser')}>{awayScore}</div>
              </div>
              <div className="gr-status-badge">FT</div>
            </>
          )}
          {isLive && (
            <>
              <div className="gr-scores">
                <div className="gr-score-num">{homeScore ?? '–'}</div>
                <div className="gr-score-num">{awayScore ?? '–'}</div>
              </div>
              <div className="gr-status-badge live">Live</div>
            </>
          )}
          {isUpcoming && (
            <>
              <div className="gr-time-col">
                <div className="gr-time-main">{format(kickoff, 'HH:mm')}</div>
                <div className="gr-time-date">
                  {format(kickoff, 'd MMM', { locale: sv })}
                </div>
              </div>
              {onPredict && (
                <button
                  type="button"
                  className="gr-pred-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPredict();
                  }}
                >
                  {prediction ? 'Ändra →' : 'Tippa →'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isFinished && prediction && (
        <div className="gr-predict-strip">
          <div className="gr-prediction-label">Din tippning</div>
          <div className="gr-my-pred">
            {prediction.home} – {prediction.away}{' '}
            {predictionPoints != null && (
              <span className="ml-1 text-neutral-500">
                {predictionPoints > 0 ? `✓ +${predictionPoints}p` : `✗ +0p`}
              </span>
            )}
          </div>
        </div>
      )}
      {isUpcoming && prediction && (
        <div className="gr-predict-strip">
          <div className="gr-prediction-label">Din tippning</div>
          <div className="gr-my-pred">
            {prediction.home} – {prediction.away}
          </div>
        </div>
      )}
    </div>
  );
}
