import { useResultReveal } from '../../hooks/useResultReveal.js';

export default function ResultRevealDevTools() {
  const { clearSeen, openDemo, openFirstFinished } = useResultReveal();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="result-reveal-dev-tools" aria-label="Utvecklarverktyg resultat">
      <button type="button" onClick={clearSeen}>
        Återställ sett
      </button>
      <button type="button" onClick={openDemo}>
        Öppna demo
      </button>
      <button type="button" onClick={() => openFirstFinished()}>
        Öppna första avslutade
      </button>
    </div>
  );
}
