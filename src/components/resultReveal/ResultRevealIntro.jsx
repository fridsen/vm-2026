import clsx from 'clsx';

export default function ResultRevealIntro({ match, introStep, countdown }) {
  return (
    <div className="result-reveal-intro">
      <div
        className={clsx('result-reveal-intro-meta', introStep >= 1 && 'is-visible')}
      >
        <span>{match.competition}</span>
        <span>{match.date}</span>
      </div>
      <div
        className={clsx('result-reveal-intro-flags', introStep >= 2 && 'is-visible')}
      >
        <span className="result-reveal-intro-flag">{match.home.flag}</span>
        <span className="result-reveal-intro-vs">vs</span>
        <span className="result-reveal-intro-flag">{match.away.flag}</span>
      </div>
      <div
        className={clsx('result-reveal-intro-teams', introStep >= 3 && 'is-visible')}
      >
        {match.home.fullName} – {match.away.fullName}
      </div>
      {countdown == null ? (
        <div
          className={clsx('result-reveal-intro-ready', introStep >= 4 && 'is-visible')}
        >
          Är du redo?
        </div>
      ) : (
        <div className="result-reveal-intro-countdown is-visible">{countdown}</div>
      )}
    </div>
  );
}
