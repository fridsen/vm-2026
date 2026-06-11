import { Link } from 'react-router-dom';
import movementDownIcon from '../../assets/live/movement-down.svg';
import movementNeutralIcon from '../../assets/live/movement-neutral.svg';
import movementUpIcon from '../../assets/live/movement-up.svg';

const MOVEMENT_ICONS = {
  up: movementUpIcon,
  neutral: movementNeutralIcon,
  down: movementDownIcon,
};

function movementDisplay(delta) {
  if (delta == null || delta === 0) {
    return { label: '0', direction: 'neutral' };
  }
  if (delta > 0) {
    return { label: `+${delta}`, direction: 'up' };
  }
  return { label: `${delta}`, direction: 'down' };
}

function MovementIcon({ direction }) {
  return (
    <img
      src={MOVEMENT_ICONS[direction]}
      alt=""
      className="live-stat-movement-icon"
      aria-hidden
    />
  );
}

export default function LiveStatsRow({ rank, totalPlayers, movement }) {
  const movementUi = movementDisplay(movement);

  return (
    <section className="live-stats-row">
      <Link to="/leaderboard" className="live-stat-card live-stat-card--position">
        <p className="live-stat-title">Position</p>
        <div className="live-stat-body">
          <p className="live-stat-value">{rank == null ? '–' : `#${rank}`}</p>
          <p className="live-stat-sub live-stat-sub--muted">av {totalPlayers} deltagare</p>
        </div>
      </Link>

      <div className="live-stat-card live-stat-card--movement">
        <MovementIcon direction={movementUi.direction} />
        <div className="live-stat-body">
          <p className="live-stat-value">{movementUi.label}</p>
          <p className="live-stat-sub live-stat-sub--muted">sedan förra matchen</p>
        </div>
      </div>
    </section>
  );
}
