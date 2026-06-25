import clsx from 'clsx';

export const PLAYER_SHEET_TABS = [
  { id: 'matcher', label: 'Matcher' },
  { id: 'grupper', label: 'Grupper' },
  { id: 'topp3', label: 'Topp 3' },
];

export default function LeaderboardPlayerSheetTabs({ value, onChange }) {
  return (
    <div className="lb-sheet-tabs" role="tablist" aria-label="Tippningstyp">
      {PLAYER_SHEET_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx('lb-sheet-tab', value === tab.id && 'is-active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
