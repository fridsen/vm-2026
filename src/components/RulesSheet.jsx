import clsx from 'clsx';
import BottomSheet from './BottomSheet.jsx';

export const RULE_SECTIONS = [
  {
    title: 'Gruppspelet',
    cards: [
      {
        title: 'Tippa matcherna',
        meta: '72 matcher',
        items: [
          { color: 'lime', content: <>Tippa <strong>exakt resultat</strong> för varje match</> },
          {
            color: 'lime',
            content: (
              <>
                Tippa <strong>tecken (1, X, 2)</strong> för varje match. Tecknet behöver
                inte stämma överens med tippat resultat
              </>
            ),
          },
          {
            color: 'lime',
            content: 'Du kan ändra ditt tips hur många gånger du vill innan första avsparken i gruppspelet',
          },
          {
            color: 'orange',
            content: 'Om du inte tippar en match innan avspark registreras automatiskt 0-0 och X som ditt tips',
          },
          {
            color: 'red',
            content: 'Deadline: Ditt tips låses när först matchen i gruppspelet startar (avsparkstid). Efter avspark kan du inte längre ändra eller lägga ett nytt tips.',
          },
        ],
      },
      {
        title: 'Poängsättning',
        meta: 'Max 6 poäng per match',
        items: [
          { color: 'lime', content: 'Rätt tecken (1, X, 2)', points: '3P' },
          { color: 'lime', content: 'Rätt antal mål hemmalag', points: '1P' },
          { color: 'lime', content: 'Rätt antal mål bortalag', points: '1P' },
          { color: 'cyan', content: 'Bonus: Rätt tecken + rätt resultat', points: '1P' },
        ],
      },
    ],
  },
  {
    title: 'Slutspelet',
    cards: [
      {
        title: 'Tippa placering',
        meta: '12 grupper',
        items: [
          { color: 'lime', content: 'Tippa hur grupperna slutar i rangordning' },
          {
            color: 'lime',
            content: 'Du kan ändra ditt tips hur många gånger du vill innan första avsparken i gruppspelet',
          },
          {
            color: 'orange',
            content: 'Om du inte tippar innan avspark registreras automatiskt ordningen som den är innan VM',
          },
          {
            color: 'red',
            content: 'Deadline: Ditt tips låses när först matchen i gruppspelet startar (avsparkstid). Efter avspark kan du inte längre ändra eller lägga ett nytt tips.',
          },
        ],
      },
      {
        title: 'Poängsättning',
        meta: 'Max 7 poäng per grupp',
        items: [
          { color: 'lime', content: 'Rätt gruppsegrare', points: '2P' },
          { color: 'lime', content: 'Rätt tvåa', points: '1P' },
          { color: 'lime', content: 'Rätt trea', points: '1P' },
          { color: 'cyan', content: 'Bonus: Hela gruppen i rätt ordning', points: '3P' },
          { color: 'green', content: <strong>Rätt VM-vinnare</strong>, points: '20P' },
        ],
      },
    ],
  },
];

export function RuleCard({ card }) {
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

export default function RulesSheet({ open, onClose }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy="rules-title"
      padded={false}
      maxWidth="max-w-[390px]"
      className="mina-rules-sheet"
    >
      <h2 id="rules-title">Regler och poäng</h2>
      <div className="mina-rules-content">
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
    </BottomSheet>
  );
}
