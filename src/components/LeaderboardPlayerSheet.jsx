import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet.jsx';
import { RankBadge } from './LeaderboardRowFace.jsx';
import LeaderboardPlayerSheetGroups from './LeaderboardPlayerSheetGroups.jsx';
import LeaderboardPlayerSheetMatches from './LeaderboardPlayerSheetMatches.jsx';
import LeaderboardPlayerSheetTabs from './LeaderboardPlayerSheetTabs.jsx';
import LeaderboardPlayerSheetTopThree from './LeaderboardPlayerSheetTopThree.jsx';
import {
  fetchUserGroupStandings,
  fetchUserMatchPredictions,
} from '../services/predictionsService.js';

export default function LeaderboardPlayerSheet({ player, matches, now, onClose }) {
  const open = player != null;
  const [tab, setTab] = useState('matcher');
  const [matchPredictions, setMatchPredictions] = useState({});
  const [groupStandings, setGroupStandings] = useState({});
  const [matchLoading, setMatchLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [sheetPhase, setSheetPhase] = useState(null);
  const bodyRef = useRef(null);
  const dayRefs = useRef(new Map());

  useEffect(() => {
    if (!open) {
      setTab('matcher');
      return undefined;
    }
    setTab('matcher');
  }, [open, player?.userId]);

  useEffect(() => {
    if (!player?.userId) return;
    setMatchPredictions({});
    setGroupStandings({});
  }, [player?.userId]);

  useEffect(() => {
    if (!open || !player?.userId) return undefined;

    setMatchLoading(true);
    setGroupLoading(true);
    let cancelled = false;

    Promise.allSettled([
      fetchUserMatchPredictions(player.userId),
      fetchUserGroupStandings(player.userId),
    ])
      .then(([matchResult, groupResult]) => {
        if (cancelled) return;
        setMatchPredictions(
          matchResult.status === 'fulfilled' ? (matchResult.value ?? {}) : {},
        );
        setGroupStandings(
          groupResult.status === 'fulfilled' ? (groupResult.value ?? {}) : {},
        );
      })
      .finally(() => {
        if (!cancelled) {
          setMatchLoading(false);
          setGroupLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, player?.userId]);

  useEffect(() => {
    if (!open) {
      dayRefs.current.clear();
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
  }, [open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [tab]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onPhaseChange={setSheetPhase}
      labelledBy="lb-sheet-player-name"
      padded={false}
      className="lb-player-sheet"
    >
      {player ? (
        <>
          <header className="lb-sheet-header">
            <div className="lb-sheet-header-left">
              <RankBadge rank={player.rank} className="lb-sheet-rank" />
              <span className="lb-sheet-name" id="lb-sheet-player-name">
                {player.name}
              </span>
            </div>
            <span className="lb-sheet-points">{player.points}</span>
          </header>

          <LeaderboardPlayerSheetTabs value={tab} onChange={setTab} />

          <div ref={bodyRef} className="lb-sheet-body">
            {tab === 'matcher' ? (
              <LeaderboardPlayerSheetMatches
                matches={matches}
                now={now}
                predictions={matchPredictions}
                loading={matchLoading}
                sheetPhase={sheetPhase}
                bodyRef={bodyRef}
                dayRefs={dayRefs}
              />
            ) : null}
            {tab === 'grupper' ? (
              <LeaderboardPlayerSheetGroups
                matches={matches}
                groupStandings={groupStandings}
                loading={groupLoading}
              />
            ) : null}
            {tab === 'topp3' ? <LeaderboardPlayerSheetTopThree /> : null}
          </div>
        </>
      ) : null}
    </BottomSheet>
  );
}
