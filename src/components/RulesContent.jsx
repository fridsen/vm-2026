import clsx from 'clsx';
import { RULE_SECTIONS } from '../data/rulesContent.jsx';

function RuleCard({ card }) {
  return (
    <div className="mina-rules-card">
      <div className="mina-rules-card-header">
        <span>{card.title}</span>
        <span>{card.meta}</span>
      </div>
      <div className="mina-rules-list">
        {card.items.map((item, index) => (
          <div key={`${card.title}-${index}`} className="mina-rules-row">
            <span className={clsx('mina-rules-dot', item.color)} />
            <span className="mina-rules-text">{item.content}</span>
            {item.points && <span className="mina-rules-points">{item.points}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RulesContent() {
  return (
    <>
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
    </>
  );
}
