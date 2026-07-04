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
        ],
      },
    ],
  },
  {
    title: 'Topp 3 i VM',
    cards: [
      {
        title: 'Tippa prispallen',
        meta: '3 lag',
        items: [
          { color: 'lime', content: 'Tippa vilka lag som tar guld, silver och brons i VM' },
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
        meta: 'Max 30 poäng',
        items: [
          { color: 'lime', content: <strong>Rätt VM-guld (1:a)</strong>, points: '15P' },
          { color: 'lime', content: <strong>Rätt VM-silver (2:a)</strong>, points: '10P' },
          { color: 'lime', content: <strong>Rätt VM-brons (3:e)</strong>, points: '5P' },
        ],
      },
    ],
  },
];
