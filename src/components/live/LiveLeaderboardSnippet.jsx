import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RankBadge } from '../LeaderboardRowFace.jsx';
import { ranksFromEntries } from '../../utils/leaderboardMovement.js';

function SnippetRow({ rank, name, points, isUser }) {
  return (
    <div className={`live-lb-row${isUser ? ' is-user' : ''}`}>
      <div className="live-lb-left">
        <RankBadge rank={rank} className={isUser && rank > 3 ? 'is-user' : undefined} />
        <span className="live-lb-name">{name}</span>
      </div>
      <span className="live-lb-points">{points}</span>
    </div>
  );
}

export default function LiveLeaderboardSnippet({ entries, myUserId }) {
  const ranks = useMemo(() => ranksFromEntries(entries), [entries]);
  const topThree = entries.slice(0, 3);
  const myIndex = entries.findIndex((e) => e.userId === myUserId);
  const myRank = myUserId ? ranks[myUserId] : null;
  const showUserRow = myRank != null && myRank > 3;
  const myEntry = myIndex >= 0 ? entries[myIndex] : null;

  return (
    <Link to="/leaderboard" className="live-lb-snippet">
      <p className="live-lb-title">Leaderboard</p>
      <div className="live-lb-list">
        {topThree.map((entry) => (
          <SnippetRow
            key={entry.userId}
            rank={ranks[entry.userId]}
            name={entry.name}
            points={entry.points}
            isUser={entry.userId === myUserId}
          />
        ))}
        {showUserRow && myEntry && myRank != null ? (
          <SnippetRow
            rank={myRank}
            name={myEntry.name}
            points={myEntry.points}
            isUser
          />
        ) : null}
      </div>
    </Link>
  );
}
