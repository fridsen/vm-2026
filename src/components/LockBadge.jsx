import clsx from 'clsx';
import { STATE } from '../utils/lockRules.js';

const STYLES = {
  [STATE.OPEN]: {
    label: 'Öppen',
    className: 'bg-pitch-100 text-pitch-600 ring-pitch-500/25',
    icon: '●',
  },
  [STATE.LOCKED]: {
    label: 'Låst',
    className: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
    icon: '🔒',
  },
  [STATE.NOT_AVAILABLE]: {
    label: 'Ej tillgänglig',
    className:
      'bg-transparent text-neutral-500 ring-neutral-300 border border-dashed border-neutral-300',
    icon: '○',
  },
};

export default function LockBadge({ state, label, className }) {
  const conf = STYLES[state] || STYLES[STATE.NOT_AVAILABLE];
  return (
    <span className={clsx('chip', conf.className, className)}>
      <span className="text-[9px]">{conf.icon}</span>
      {label || conf.label}
    </span>
  );
}
