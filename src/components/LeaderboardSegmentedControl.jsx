import clsx from 'clsx';

export const LEADERBOARD_VIEWS = [
  { id: 'totalt', label: 'Totalt' },
  { id: 'matcher', label: 'Matcher' },
  { id: 'grupper', label: 'Grupper' },
  { id: 'topp3', label: 'Topp 3' },
];

export default function LeaderboardSegmentedControl({ value, onChange }) {
  const activeIndex = Math.max(0, LEADERBOARD_VIEWS.findIndex((tab) => tab.id === value));

  return (
    <div
      className="mina-segmented lb-segmented"
      role="tablist"
      aria-label="Leaderboardvy"
      style={{
        '--segment-count': LEADERBOARD_VIEWS.length,
        '--segment-index': activeIndex,
      }}
    >
      {LEADERBOARD_VIEWS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx('mina-segmented-tab', value === tab.id && 'active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
