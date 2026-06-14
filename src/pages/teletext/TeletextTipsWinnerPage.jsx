import { useMemo } from 'react';
import { usePredictions } from '../../hooks/usePredictions.js';
import { useTeams } from '../../hooks/useTeams.js';
import { getTopThree } from '../../utils/topThree.js';

export default function TeletextTipsWinnerPage() {
  const { predictions } = usePredictions();
  const { teams } = useTeams();
  const topThree = useMemo(() => getTopThree(predictions), [predictions]);

  const rankedTeams = useMemo(
    () =>
      topThree
        .map((teamId, index) => {
          if (!teamId) return null;
          const team = teams.find((item) => item.id === teamId);
          return team ? { team, rank: index + 1 } : null;
        })
        .filter(Boolean),
    [teams, topThree],
  );

  return (
    <section className="teletext-article">
      <p className="teletext-row teletext-row--green">Vinnare</p>
      {rankedTeams.length === 0 ? (
        <p className="teletext-row teletext-row--cyan">Inga tips angivna.</p>
      ) : null}
      {rankedTeams.map(({ team, rank }) => (
        <div key={team.id} className="teletext-tips-group-row">
          <span className="teletext-row teletext-row--yellow">{team.name}</span>
          <span className="teletext-row">{rank}</span>
        </div>
      ))}
    </section>
  );
}
