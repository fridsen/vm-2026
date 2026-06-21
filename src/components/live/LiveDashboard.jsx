import { useMemo } from 'react';
import NewsFeedCard from '../NewsFeedCard.jsx';
import {
  finishedMatchResultsSignature,
  latestFinishedMatchId,
  rankForUser,
  resolveRankMovements,
  sortLeaderboardEntries,
} from '../../utils/leaderboardMovement.js';
import { aggregateMatchPointsBreakdown } from '../../utils/matchPointsBreakdown.js';
import LiveHeroMatch from './LiveHeroMatch.jsx';
import TodayMatchesCard from '../matches/TodayMatchesCard.jsx';
import LivePointsCard from './LivePointsCard.jsx';
import LivePointsPerMatch from './LivePointsPerMatch.jsx';
import LiveStatsRow from './LiveStatsRow.jsx';
import LiveLeaderboardSnippet from './LiveLeaderboardSnippet.jsx';

export default function LiveDashboard({
  matches,
  now,
  predictions,
  entries,
  myUserId,
  myEntry,
  newsArticles,
  newsLoading,
}) {
  const sortedEntries = useMemo(() => sortLeaderboardEntries(entries), [entries]);

  const anchorMatchId = useMemo(() => latestFinishedMatchId(matches), [matches]);

  const resultsSignature = useMemo(
    () => finishedMatchResultsSignature(matches),
    [matches],
  );

  const movements = useMemo(
    () => resolveRankMovements(sortedEntries, anchorMatchId, resultsSignature),
    [sortedEntries, anchorMatchId, resultsSignature],
  );

  const breakdown = useMemo(
    () => aggregateMatchPointsBreakdown(matches, predictions),
    [matches, predictions],
  );

  const myMovement = myUserId ? movements[myUserId] : undefined;

  const myRank = useMemo(() => rankForUser(entries, myUserId), [entries, myUserId]);

  return (
    <div className="home-page">
      <LiveHeroMatch matches={matches} now={now} predictions={predictions} />
      <TodayMatchesCard matches={matches} now={now} predictions={predictions} />
      <LivePointsCard totalPoints={myEntry?.points ?? 0} rows={breakdown.totalRows} />
      <LiveStatsRow
        rank={myRank}
        totalPlayers={entries.length}
        movement={myMovement}
      />
      <LivePointsPerMatch matches={matches} predictions={predictions} />
      <LiveLeaderboardSnippet entries={sortedEntries} myUserId={myUserId} />
      <NewsFeedCard articles={newsArticles} loading={newsLoading} />
    </div>
  );
}
