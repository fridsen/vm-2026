import clsx from 'clsx';

export default function PillToggle({ value, onChange, options }) {
  return (
    <div className="pill-wrap" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx('pill', value === opt.value && 'active')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
