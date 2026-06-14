import { useMemo } from 'react';
import clsx from 'clsx';
import { useAllMatches } from '../../hooks/useMatches.js';
import { useTeams } from '../../hooks/useTeams.js';
import { groupLetterFromPage } from '../../teletext/constants.js';
import {
  computeGroupStandings,
  displayScore,
  getMatchDayKey,
  getMatchState,
  MATCH_STATE,
} from '../../utils/matchSchedule.js';
import {
  formatTeletextMatchDate,
  formatTeletextScore,
} from '../../utils/teletextDisplay.js';

function formatGoalDifference(value) {
  return value > 0 ? `+${value}` : String(value);
}

export default function TeletextGroupPage({ pageNum }) {
  const group = groupLetterFromPage(pageNum);
  const { matches } = useAllMatches();
  const { getTeamsInGroup, getTeamById } = useTeams();

  const groupMatches = useMemo(
    () =>
      matches
        .filter((match) => match.group === group)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [group, matches],
  );

  const standings = useMemo(() => {
    const teams = getTeamsInGroup(group, matches);
    return computeGroupStandings(groupMatches, teams);
  }, [group, groupMatches, getTeamsInGroup, matches]);

  const now = Date.now();

  return (
    <div className="teletext-group-page">
      <div className="teletext-group-matches">
        {groupMatches.map((match, index) => {
          const state = getMatchState(match, now);
          const isLive = state === MATCH_STATE.LIVE;
          const score = displayScore(match);
          const hasScore = score != null;
          const homeTeam = getTeamById(match.homeTeamId);
          const awayTeam = getTeamById(match.awayTeamId);
          const homeName = homeTeam?.name ?? match.homeTeamId;
          const awayName = awayTeam?.name ?? match.awayTeamId;
          const scoreLabel = hasScore ? `${score.home}-${score.away}` : formatTeletextScore(match);
          const accent = isLive || hasScore;
          const prevMatch = groupMatches[index - 1];
          const formattedDate = formatTeletextMatchDate(match.kickoff);
          const showDate =
            !prevMatch || getMatchDayKey(match.kickoff) !== getMatchDayKey(prevMatch.kickoff);

          return (
            <div key={match.id} className="teletext-match-grid teletext-match-grid--score">
              <span
                className={clsx(
                  'teletext-row teletext-row--yellow teletext-match-date',
                  !showDate && 'teletext-match-date--hidden',
                )}
              >
                {formattedDate}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-tips-match-home',
                  accent && 'teletext-row--cyan',
                )}
              >
                {homeName}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-tips-match-away',
                  accent && 'teletext-row--cyan',
                )}
              >
                - {awayName}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-tips-match-score',
                  accent && 'teletext-row--cyan',
                )}
              >
                {scoreLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="teletext-group-standings">
        {standings.map((row, index) => {
          const isQualifier = index < 2;
          return (
            <div key={row.team.id} className="teletext-standings-row">
              <span className={clsx('teletext-row', isQualifier && 'teletext-row--green')}>
                {index + 1}
              </span>
              <span
                className={clsx('teletext-row', isQualifier && 'teletext-row--green')}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {row.team.name}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {row.played}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {row.won}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {row.drawn}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {row.lost}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {formatGoalDifference(row.gd)}
              </span>
              <span
                className={clsx(
                  'teletext-row teletext-standings-stat',
                  isQualifier && 'teletext-row--green',
                )}
              >
                {row.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
