import { GROUPS } from '../../data/teams.js';
import { useAllMatches } from '../../hooks/useMatches.js';
import { useTeams } from '../../hooks/useTeams.js';
import { groupPageNumber } from '../../teletext/constants.js';
import { abbrevTeamName } from '../../utils/teletextDisplay.js';
import TeletextPageLink from '../../components/teletext/TeletextPageLink.jsx';

const GROUP_BLOCKS = [
  GROUPS.slice(0, 4),
  GROUPS.slice(4, 8),
  GROUPS.slice(8, 12),
];

export default function TeletextMatcherIndexPage() {
  const { matches } = useAllMatches();
  const { getTeamsInGroup } = useTeams();

  return (
    <>
      <p className="teletext-row teletext-row--green">
        VM USA/MEX/CAN 11 juni - 19 juli
      </p>
      {GROUP_BLOCKS.map((block, blockIndex) => (
        <div
          key={block.join('-')}
          className={blockIndex < GROUP_BLOCKS.length - 1 ? 'teletext-article' : undefined}
        >
          {block.map((group) => {
            const teams = getTeamsInGroup(group, matches);
            const page = groupPageNumber(group);
            const abbrevList = teams.map((team) => abbrevTeamName(team.name)).join('/');
            return (
              <p key={group} className="teletext-group-index-row">
                <span className="teletext-row--yellow">Grupp {group}</span>{' '}
                <TeletextPageLink page={page}>{page}</TeletextPageLink>: {abbrevList}
              </p>
            );
          })}
        </div>
      ))}
    </>
  );
}
