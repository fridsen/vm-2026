import { useEffect } from 'react';

export default function PortraitGate() {
  useEffect(() => {
    screen.orientation?.lock?.('portrait-primary').catch(() => {});
  }, []);

  return (
    <div className="portrait-gate" role="dialog" aria-modal="true" aria-label="Rotera enheten">
      <div className="portrait-gate-card">
        <span className="portrait-gate-icon" aria-hidden>
          ↻
        </span>
        <p className="portrait-gate-title">Vänd telefonen</p>
        <p className="portrait-gate-text">
          VM-tipset fungerar bäst i stående läge.
        </p>
      </div>
    </div>
  );
}
