import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { REVEAL_PHASE } from '../../utils/revealPhases.js';
import ResultRevealEventRow from './ResultRevealEventRow.jsx';

export default function ResultRevealTicker({
  match,
  phase,
  visibleEvents,
  progress,
  scoreRevealed,
  predictionRevealed,
  pointsRevealed,
  countingPoints,
  onDone,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleEvents.length, scoreRevealed, predictionRevealed, pointsRevealed]);

  const isResult =
    phase === REVEAL_PHASE.SCORE ||
    phase === REVEAL_PHASE.PREDICTION ||
    phase === REVEAL_PHASE.POINTS;

  return (
    <div className="result-reveal-ticker">
      <header className="result-reveal-ticker-header">
        <p className="result-reveal-ticker-competition">{match.competition}</p>
        <p className="result-reveal-ticker-teams">
          <span>
            {match.home.flag} {match.home.name}
          </span>
          <span className="result-reveal-ticker-dash">–</span>
          <span>
            {match.away.name} {match.away.flag}
          </span>
        </p>
      </header>

      <div className="result-reveal-progress">
        <div className="result-reveal-progress-track">
          <div
            className="result-reveal-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="result-reveal-progress-labels">
          <span>0&apos;</span>
          <span>45&apos;</span>
          <span>90&apos;</span>
        </div>
      </div>

      <div className="result-reveal-events-scroll">
        {visibleEvents.map((ev, i) => (
          <ResultRevealEventRow key={`${ev.minute}-${ev.type}-${i}`} event={ev} />
        ))}

        {progress === 100 && !isResult ? (
          <p className="result-reveal-fulltime">Slutvisselblåsning</p>
        ) : null}

        {isResult ? (
          <div
            className={clsx('result-reveal-score-block', scoreRevealed && 'is-visible')}
          >
            <p className="result-reveal-score-label">Slutresultat</p>
            <p className="result-reveal-score-value">
              <span>{match.homeScore}</span>
              <span className="result-reveal-score-sep">–</span>
              <span>{match.awayScore}</span>
            </p>
          </div>
        ) : null}

        {phase === REVEAL_PHASE.PREDICTION || phase === REVEAL_PHASE.POINTS ? (
          <div
            className={clsx(
              'result-reveal-prediction',
              predictionRevealed && 'is-visible',
            )}
          >
            <p className="result-reveal-prediction-label">Ditt tips</p>
            <p className="result-reveal-prediction-score">{match.userPrediction}</p>
            <p className="result-reveal-prediction-verdict">{match.verdict}</p>
          </div>
        ) : null}

        {phase === REVEAL_PHASE.POINTS ? (
          <div
            className={clsx('result-reveal-points', pointsRevealed && 'is-visible')}
          >
            <p className="result-reveal-points-num">{countingPoints}</p>
            <p className="result-reveal-points-label">poäng</p>
            <button type="button" className="result-reveal-done-btn" onClick={onDone}>
              Tillbaka
            </button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
