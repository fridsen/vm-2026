import { useMemo } from 'react';
import { GROUPS } from '../../data/teams.js';
import { useAllMatches } from '../../hooks/useMatches.js';
import { usePredictions } from '../../hooks/usePredictions.js';
import { useTeams } from '../../hooks/useTeams.js';
import { TELETEXT_TIPS_MATCH_START } from '../../teletext/constants.js';
import { predictionSign } from '../../utils/signFromScore.js';
import { normalizeMatchPrediction } from '../../utils/matchPredictionDisplay.js';

const GROUPS_PER_PAGE = 4;

function groupsForPage(pageNum) {
  const pageIndex = pageNum - TELETEXT_TIPS_MATCH_START;
  const start = pageIndex * GROUPS_PER_PAGE;
  return GROUPS.slice(start, start + GROUPS_PER_PAGE);
}

export default function TeletextTipsMatchPage({ pageNum }) {
  const { matches } = useAllMatches();
  const { predictions } = usePredictions();
  const { getTeamById } = useTeams();
  const pageGroups = groupsForPage(pageNum);

  const matchesByGroup = useMemo(() => {
    const map = {};
    for (const group of pageGroups) {
      map[group] = matches
        .filter((match) => match.group === group)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    }
    return map;
  }, [matches, pageGroups]);

  return (
    <>
      {pageGroups.map((group) => {
        const groupMatches = matchesByGroup[group] ?? [];
        if (groupMatches.length === 0) return null;
        return (
          <section key={group} className="teletext-article">
            <p className="teletext-row teletext-row--green">Grupp {group}</p>
            {groupMatches.map((match) => {
              const home = getTeamById(match.homeTeamId);
              const away = getTeamById(match.awayTeamId);
              const pred = normalizeMatchPrediction(predictions?.matches?.[match.id]);
              const sign = predictionSign(pred);
              const score =
                pred?.home != null && pred?.away != null
                  ? `${pred.home}-${pred.away}`
                  : '–-–';
              return (
                <div key={match.id} className="teletext-tips-match-row">
                  <span className="teletext-row teletext-tips-match-home">
                    {home?.name ?? '?'}
                  </span>
                  <span className="teletext-row teletext-tips-match-away">
                    - {away?.name ?? '?'}
                  </span>
                  <span className="teletext-row teletext-tips-match-score">{score}</span>
                  <span className="teletext-row teletext-row--yellow teletext-tips-match-sign">
                    {sign ?? '?'}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
