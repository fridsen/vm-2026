import { useEffect, useRef } from 'react';
import { RULE_SECTIONS, RuleCard } from './RulesSheet.jsx';

export default function MinaTipsIntroModal({ open, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const scroller = overlayRef.current?.closest('main') || null;
    const targets = [document.body, scroller].filter(Boolean);
    const previous = targets.map((target) => target.style.overflow);
    targets.forEach((target) => {
      target.style.overflow = 'hidden';
    });
    return () => {
      targets.forEach((target, index) => {
        target.style.overflow = previous[index];
      });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="mina-intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mina-intro-title"
    >
      <div className="mina-intro-backdrop" aria-hidden />
      <div className="mina-intro-modal">
        <header className="mina-intro-header">
          <h2 id="mina-intro-title">Regler och poäng</h2>
          <button type="button" className="mina-intro-close" onClick={onClose} aria-label="Stäng">
            x
          </button>
        </header>
        <div className="mina-intro-content">
          {RULE_SECTIONS.map((section) => (
            <section key={section.title} className="mina-rules-section">
              <h3>{section.title}</h3>
              <div className="mina-rules-cards">
                {section.cards.map((card) => (
                  <RuleCard key={`${section.title}-${card.title}`} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
