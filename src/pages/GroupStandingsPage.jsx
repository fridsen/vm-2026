import { useMemo } from 'react';
import clsx from 'clsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useTeams } from '../hooks/useTeams.js';
import { GROUPS } from '../data/teams.js';
import { computeGroupStandings } from '../utils/matchSchedule.js';
import PageHeader from '../components/PageHeader.jsx';

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
        <div className="flex items-center gap-1.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="block h-2.5 w-2.5 rounded-full bg-pink-400" />
          <span className="ml-1 text-[10px] font-semibold text-neutral-500">Vidare</span>
        </div>
      </div>
      <div className="gt-col-headers">
        <div className="col-team">Lag</div>
        <div className="col-num">Sp</div>
        <div className="col-num">V</div>
        <div className="col-num">O</div>
        <div className="col-pts">P</div>
      </div>
      {standings.map((row, idx) => (
        <div
          key={row.team.id}
          className={clsx(
            'gt-row',
            idx === 0 && 'qualify-1st',
            idx === 1 && 'qualify-2nd',
          )}
        >
          <div className="gt-pos">{idx + 1}</div>
          <div className="gt-flag" aria-hidden>
            {row.team.flag}
          </div>
          <div className="gt-team-name">{row.team.name}</div>
          <div className="gt-num">{row.played}</div>
          <div className="gt-num">{row.won}</div>
          <div className="gt-num">{row.drawn}</div>
          <div className="gt-pts">{row.points}</div>
        </div>
      ))}
    </div>
  );
}

export default function GroupStandingsPage() {
  const { matches } = useAllMatches();

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader title="Grupper" subtitle="Tabell · gruppspel" />

      <div className="space-y-2">
        {GROUPS.map((g) => (
          <GroupTable key={g} group={g} matches={matches} />
        ))}
      </div>

      <div className="flex items-center gap-4 px-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent" />
          <span className="text-[11px] font-semibold text-neutral-500">1:a — direkt vidare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-pink-400" />
          <span className="text-[11px] font-semibold text-neutral-500">2:a — vidare</span>
        </div>
      </div>
    </div>
  );
}
