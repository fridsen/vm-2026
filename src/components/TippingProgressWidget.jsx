import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import matchesIcon from '../assets/mina-tips/matches-icon.svg';
import groupsIcon from '../assets/mina-tips/groups-icon.svg';
import winnerIcon from '../assets/mina-tips/winner-icon.svg';
import { getTippingProgress } from '../utils/tippingProgress.js';

const MORPH_MS = 380;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

function overlayPortalTarget() {
  return document.querySelector('.phone-screen') ?? document.body;
}

function ProgressRing({ pct, size = 48, showOuterRing = false }) {
  const gradId = useId();
  const cx = size / 2;
  const inner = size - 12;
  const innerRadius = inner / 2;
  const trackOuterRadius = (size - 2) / 2;
  const stroke = trackOuterRadius - innerRadius;
  const r = innerRadius + stroke / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(pct, 100) / 100);

  return (
    <div
      className="home-progress-ring"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="home-progress-ring-svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d67475" />
            <stop offset="75%" stopColor="#9e57d3" />
            <stop offset="100%" stopColor="#9e57d3" />
          </linearGradient>
        </defs>
        {showOuterRing ? (
          <circle cx={cx} cy={cx} r={cx} fill="#fff" />
        ) : null}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#eff0f9"
          strokeWidth={stroke}
        />
        {pct > 0 && (
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        )}
      </svg>
      <div
        className={clsx(
          'home-progress-ring-inner',
          showOuterRing && 'home-progress-ring-inner--collapsed',
        )}
        style={{ width: inner, height: inner }}
      >
        <span className="home-progress-ring-value">{pct}%</span>
      </div>
    </div>
  );
}

function ProgressRow({ icon, label, pct }) {
  return (
    <div className="home-tipping-row">
      <div className="home-tipping-row-head">
        <div className="home-tipping-row-title">
          <img src={icon} alt="" />
          <span>{label}</span>
        </div>
        <span className="home-tipping-row-pct">{pct}%</span>
      </div>
      <div
        className="home-tipping-bar"
        style={{ '--fill': `${Math.min(pct, 100)}%` }}
      >
        <div className="home-tipping-bar-fill" />
      </div>
    </div>
  );
}

export default function TippingProgressWidget({
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  topThreeFilled,
}) {
  const progress = getTippingProgress({
    matchCount,
    totalMatches,
    rankedGroups,
    totalGroups,
    topThreeFilled,
  });

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [shellStyle, setShellStyle] = useState(null);
  const [shellAnimating, setShellAnimating] = useState(false);
  const [ringPlacement, setRingPlacement] = useState('center');
  const anchorRef = useRef(null);
  const shellRef = useRef(null);
  const closeTimerRef = useRef(null);
  const morphTimerRef = useRef(null);
  const portalTarget = open ? overlayPortalTarget() : null;
  const inPhoneFrame = portalTarget?.classList?.contains('phone-screen');
  const showContent = phase === 'open';

  function getRects() {
    const anchor = anchorRef.current?.getBoundingClientRect();
    const host = overlayPortalTarget()?.getBoundingClientRect();
    const content =
      anchorRef.current?.closest('.app-tab-shell')?.getBoundingClientRect() ??
      anchorRef.current?.closest('.home-page')?.getBoundingClientRect() ??
      host;
    if (!anchor || !host) return null;
    return { anchor, host, content };
  }

  function collapsedShellStyle(anchor, host) {
    return {
      left: anchor.left - host.left,
      top: anchor.top - host.top,
      width: anchor.width,
      height: anchor.height,
      borderRadius: anchor.width / 2,
    };
  }

  function expandedShellStyle(content, host, anchor) {
    return {
      left: content.left - host.left,
      top: anchor.top - host.top,
      width: content.width,
      height: 320,
      borderRadius: 16,
    };
  }

  function openPanel() {
    const rects = getRects();
    if (!rects) return;

    const { anchor, host, content } = rects;

    setOpen(true);
    setPhase('morph-in');
    setRingPlacement('center');
    setShellAnimating(false);
    setShellStyle(collapsedShellStyle(anchor, host));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRingPlacement('header');
        setShellAnimating(true);
        setShellStyle(expandedShellStyle(content, host, anchor));
      });
    });

    clearTimeout(morphTimerRef.current);
    morphTimerRef.current = window.setTimeout(() => {
      setPhase('open');
    }, MORPH_MS);
  }

  function requestClose() {
    if (!open || phase === 'morph-out' || phase === 'idle') {
      setOpen(false);
      return;
    }

    const rects = getRects();
    if (!rects) {
      setOpen(false);
      return;
    }

    const { anchor, host, content } = rects;

    setPhase('morph-out');
    setRingPlacement('header');
    setShellAnimating(false);
    setShellStyle(expandedShellStyle(content, host, anchor));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRingPlacement('center');
        setShellAnimating(true);
        setShellStyle(collapsedShellStyle(anchor, host));
      });
    });

    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setPhase('idle');
      setShellStyle(null);
      setShellAnimating(false);
      setRingPlacement('center');
    }, MORPH_MS);
  }

  useLayoutEffect(() => {
    if (!open) {
      setPhase('idle');
      setShellStyle(null);
      setShellAnimating(false);
      setRingPlacement('center');
      clearTimeout(morphTimerRef.current);
      clearTimeout(closeTimerRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, phase]);

  const shellTransition = shellAnimating
    ? `left ${MORPH_MS}ms ${EASE}, top ${MORPH_MS}ms ${EASE}, width ${MORPH_MS}ms ${EASE}, height ${MORPH_MS}ms ${EASE}, border-radius ${MORPH_MS}ms ${EASE}`
    : 'none';

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={clsx('home-progress-trigger', open && 'is-open')}
        aria-label={`Tippningsstatus ${progress.overallPct} procent. Tryck för detaljer.`}
        aria-expanded={open}
        onClick={() => (open ? requestClose() : openPanel())}
      >
        <ProgressRing pct={progress.overallPct} size={48} showOuterRing />
      </button>

      {open && portalTarget && shellStyle
        ? createPortal(
            <div className="home-tipping-overlay" role="presentation">
              <button
                type="button"
                className={clsx(
                  'home-tipping-backdrop',
                  phase !== 'morph-out' && 'is-visible',
                )}
                aria-label="Stäng status"
                onClick={requestClose}
              />
              <div
                ref={shellRef}
                className={clsx(
                  'home-tipping-shell',
                  ringPlacement === 'center'
                    ? 'is-ring-centered'
                    : 'is-ring-header',
                  showContent && 'is-expanded',
                  phase === 'morph-out' && 'is-closing',
                )}
                style={{
                  ...shellStyle,
                  position: inPhoneFrame ? 'absolute' : 'fixed',
                  transition: shellTransition,
                }}
              >
                {showContent ? (
                  <div className="home-tipping-panel-copy">
                    <div className="home-tipping-panel-header">
                      <div>
                        <h2>Status tippning</h2>
                        <p>Har du tippat klart allt?</p>
                      </div>
                    </div>

                    <div className="home-tipping-rows">
                      <ProgressRow
                        icon={matchesIcon}
                        label="Tippa matcherna"
                        pct={progress.matchesPct}
                      />
                      <ProgressRow
                        icon={groupsIcon}
                        label="Placering i gruppen"
                        pct={progress.groupsPct}
                      />
                      <ProgressRow
                        icon={winnerIcon}
                        label="Topp 3 i VM"
                        pct={progress.topThreePct}
                      />
                    </div>

                    <div className="home-tipping-panel-actions">
                      <Link
                        to="/mina-tips"
                        className="home-secondary-cta"
                        onClick={requestClose}
                      >
                        Till tippningen
                      </Link>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="home-tipping-ring-slot"
                  aria-label="Stäng status"
                  onClick={requestClose}
                >
                  <ProgressRing
                    pct={progress.overallPct}
                    size={
                      phase === 'open' && ringPlacement === 'header' ? 46 : 48
                    }
                  />
                </button>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
