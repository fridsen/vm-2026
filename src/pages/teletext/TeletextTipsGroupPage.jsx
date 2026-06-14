import { useMemo } from 'react';
import clsx from 'clsx';
import { GROUPS } from '../../data/teams.js';
import { useAllMatches } from '../../hooks/useMatches.js';
import { usePredictions } from '../../hooks/usePredictions.js';
import { useTeams } from '../../hooks/useTeams.js';
import { TELETEXT_TIPS_GROUP_START } from '../../teletext/constants.js';

const GROUPS_PER_PAGE = 6;

function groupsForPage(pageNum) {
  const pageIndex = pageNum - TELETEXT_TIPS_GROUP_START;
  const start = pageIndex * GROUPS_PER_PAGE;
  return GROUPS.slice(start, start + GROUPS_PER_PAGE);
}

export default function TeletextTipsGroupPage({ pageNum }) {
  const { matches } = useAllMatches();
  const { predictions } = usePredictions();
  const { getTeamsInGroup } = useTeams();
  const pageGroups = groupsForPage(pageNum);

  const rankedByGroup = useMemo(() => {
    const map = {};
    for (const group of pageGroups) {
      map[group] = predictions?.groupStandings?.[group] ?? [];
    }
    return map;
  }, [predictions, pageGroups]);

  return (
    <>
      {pageGroups.map((group) => {
        const ranked = rankedByGroup[group] ?? [];
        const teams = getTeamsInGroup(group, matches);
        if (teams.length === 0) return null;

        const ordered = [
          ...ranked
            .map((teamId) => teams.find((team) => team.id === teamId))
            .filter(Boolean),
          ...teams.filter((team) => !ranked.includes(team.id)),
        ];

        return (
          <section key={group} className="teletext-article">
            <p className="teletext-row teletext-row--green">Grupp {group}</p>
            {ordered.map((team) => {
              const rankIdx = ranked.indexOf(team.id);
              const rankLabel = rankIdx >= 0 ? rankIdx + 1 : '–';
              const rankNum = rankIdx >= 0 ? rankIdx + 1 : null;
              const isTopTwo = rankNum === 1 || rankNum === 2;
              return (
                <div key={team.id} className="teletext-tips-group-row">
                  <span
                    className={clsx('teletext-row', isTopTwo && 'teletext-row--yellow')}
                  >
                    {team.name}
                  </span>
                  <span className="teletext-row">{rankLabel}</span>
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
