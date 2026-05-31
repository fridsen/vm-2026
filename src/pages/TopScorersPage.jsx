import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import PillToggle from '../components/PillToggle.jsx';

const TYPES = [
  { value: 'goals', label: '⚽ Mål' },
  { value: 'assists', label: '🎯 Assists' },
  { value: 'clean', label: '🧤 Hållna nollor' },
];

// TODO: wire to a real top-scorers data hook once we have one.
const SAMPLE = {
  goals: [],
  assists: [],
  clean: [],
};

const SUFFIX = {
  goals: 'mål',
  assists: 'assists',
  clean: 'hållna nollor',
};

function PlayerRow({ player, rank, max, suffix }) {
  const pct = max ? Math.round((player.count / max) * 100) : 0;
  return (
    <div className="player-row stagger-child">
      <div className="pr-rank">{rank}</div>
      <div className="pr-flag" aria-hidden>
        {player.flag}
      </div>
      <div className="pr-info">
        <div className="pr-name">{player.name}</div>
        <div className="pr-country">
          {player.country} · {player.count} {suffix}
        </div>
      </div>
      <div className="pr-count">{player.count}</div>
      <div className="pr-bar-wrap">
        <div className="pr-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TopScorersPage() {
  const [type, setType] = useState('goals');
  const players = SAMPLE[type] ?? [];
  const max = players[0]?.count ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader title="Skytteliga" subtitle="Topp 3 målskyttar · max 25p" />

      <div>
        <PillToggle value={type} onChange={setType} options={TYPES} />
      </div>

      {players.length === 0 ? (
        <div className="card mt-2 p-10 text-center shadow-float">
          <div className="text-4xl">🎯</div>
          <div className="mt-3 font-display text-xl tracking-wide text-neutral-900">
            Kommer i nästa iteration
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            Välj 3 spelare från ~20 alternativ i rangordning.
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {players.map((p, i) => (
            <PlayerRow key={p.name} player={p} rank={i + 1} max={max} suffix={SUFFIX[type]} />
          ))}
        </div>
      )}
    </div>
  );
}
