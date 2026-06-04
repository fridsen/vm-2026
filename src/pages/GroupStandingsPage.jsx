import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useTeams } from '../hooks/useTeams.js';
import { GROUPS } from '../data/teams.js';
import { flagImageForCode } from '../data/flagImages.js';
import { computeGroupStandings } from '../utils/matchSchedule.js';
import { KnockoutContent } from './KnockoutPage.jsx';

const TABS = [
  { id: 'grupper', label: 'Gruppspel' },
  { id: 'slutspel', label: 'Slutspel' },
];

const TABLE_COLUMNS = ['SM', 'V', 'O', 'F', '+/-', 'P'];

function formatGoalDifference(value) {
  return value > 0 ? `+${value}` : value;
}

function StageSegmentedControl({ value, onChange }) {
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.id === value));

  return (
    <div
      className="mina-segmented"
      role="tablist"
      aria-label="Turneringsvy"
      style={{
        '--segment-count': TABS.length,
        '--segment-index': activeIndex,
      }}
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={clsx('mina-segmented-tab', selected && 'active')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function GroupTable({ group, matches }) {
  const { getTeamsInGroup } = useTeams();
  const teams = useMemo(
    () => getTeamsInGroup(group, matches),
    [getTeamsInGroup, group, matches],
  );
  const standings = useMemo(
    () =>
      computeGroupStandings(
        matches.filter((m) => m.group === group),
        teams,
      ),
    [matches, group, teams],
  );

  return (
    <div className="group-table-card stagger-child">
      <div className="gt-header">
        <div className="gt-group-name">Grupp {group}</div>
        <div className="gt-legend" aria-hidden>
          {TABLE_COLUMNS.map((column) => (
            <span key={column} className={column === 'P' ? 'is-points' : undefined}>
              {column}
            </span>
          ))}
        </div>
      </div>
      {standings.map((row, idx) => {
        const flagImage = flagImageForCode(row.team.code);

        return (
          <div key={row.team.id} className="gt-row">
            <div className="gt-team">
              <div className="gt-pos">{idx + 1}</div>
              <div className="gt-flag" aria-hidden>
                {flagImage ? <img src={flagImage} alt="" /> : row.team.flag}
              </div>
              <div className="gt-team-name">{row.team.name}</div>
            </div>
            <div className="gt-data">
              <span>{row.played}</span>
              <span>{row.won}</span>
              <span>{row.drawn}</span>
              <span>{row.lost}</span>
              <span>{formatGoalDifference(row.gd)}</span>
              <span className="gt-pts">{row.points}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupStandingsPage() {
  const { matches } = useAllMatches();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'slutspel' ? 'slutspel' : 'grupper';

  function setTab(nextTab) {
    setSearchParams(nextTab === 'slutspel' ? { tab: 'slutspel' } : {}, { replace: true });
  }

  return (
    <div className="tables-page">
      <header className="tables-hero">
        <h1>Tabeller</h1>
        <p>Grupper och slutspel</p>
      </header>
      <StageSegmentedControl value={tab} onChange={setTab} />

      {tab === 'grupper' ? (
        <div className="tables-card-list">
          {GROUPS.map((g) => (
            <GroupTable key={g} group={g} matches={matches} />
          ))}
        </div>
      ) : (
        <KnockoutContent />
      )}
    </div>
  );
}
