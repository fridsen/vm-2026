import { useTeams } from '../hooks/useTeams.js';
import { flagImageForCode } from '../data/flagImages.js';
import { kitColorForCode } from '../data/teamKitColors.js';
import { predictionSign } from '../utils/signFromScore.js';
import { normalizeMatchPrediction } from '../utils/matchPredictionDisplay.js';

function TeamLine({ teamId }) {
  const { getTeamById } = useTeams();
  const team = getTeamById(teamId);
  const flag = flagImageForCode(team?.code || team?.id);

  return (
    <div className="lb-day-team">
      <span
        className="lb-day-team-color"
        style={{ backgroundColor: kitColorForCode(team?.code || team?.id) }}
        aria-hidden
      />
      <span className="lb-day-team-flag" aria-hidden>
        {flag ? <img src={flag} alt="" /> : (team?.flag ?? '🏳')}
      </span>
      <span className="lb-day-team-name">{team?.name ?? 'TBD'}</span>
    </div>
  );
}

export default function LeaderboardDayMatchRow({ match, prediction }) {
  const normalized = normalizeMatchPrediction(prediction);
  const sign = predictionSign(normalized);
  const score =
    normalized?.home != null && normalized?.away != null
      ? `${normalized.home} - ${normalized.away}`
      : '—';

  return (
    <div className="lb-day-match">
      <div className="lb-day-match-teams">
        <TeamLine teamId={match.homeTeamId} />
        <TeamLine teamId={match.awayTeamId} />
      </div>
      <div className="lb-day-match-picks">
        <span className="lb-day-pick">{score}</span>
        {sign && <span className="lb-day-pick">{sign}</span>}
      </div>
    </div>
  );
}
