// Hardcoded, curated Swedish match analyses for the group stage.
//
// Replaces the previous AI/LLM-generated analysis. Each entry is keyed by the
// (order-independent) pair of FIFA team codes, so a fixture is matched purely
// by the two teams playing — regardless of home/away order or which group the
// backend has them in.
//
// Lookup: `getMatchAnalysis(homeCode, awayCode)` → string | null. Returns null
// for any matchup not listed here (e.g. knockout ties), letting callers fall
// back to their templated analysis.

const ENTRIES = [
  // ── Grupp A: Mexiko, Sydafrika, Sydkorea, Tjeckien ──────────────
  {
    teams: ['MEX', 'RSA'],
    text: 'Mexiko har hemmaplan och högre kvalitet, även om målvaktsläget oroar. Sydafrika är tillbaka efter lång frånvaro. Mexikansk seger är troligast.',
  },
  {
    teams: ['MEX', 'KOR'],
    text: 'Mexiko har publiken och bollkontrollen, Sydkorea hotar med Son och snabba kontringar. Jämn match med liten mexikansk fördel.',
  },
  {
    teams: ['MEX', 'CZE'],
    text: 'Mexiko har hemmaplan och större bredd. Tjeckien är välorganiserat men saknar samma spets. Knapp mexikansk seger är troligast.',
  },
  {
    teams: ['RSA', 'KOR'],
    text: 'Sydkorea har högre ranking och mer spets genom Son. Sydafrika är tåligt bakåt men skapar mindre framåt. Koreansk fördel.',
  },
  {
    teams: ['KOR', 'CZE'],
    text: 'Två organiserade lag där Korea har Son som matchvinnare och Tjeckien lutar sig mot kollektivet. Små marginaler, lätt koreansk fördel.',
  },
  {
    teams: ['CZE', 'RSA'],
    text: 'Tjeckien är tyngre på pappret och mer meriterat. Sydafrika är svårforcerat men svagt framåt. Knapp tjeckisk seger känns trolig.',
  },

  // ── Grupp B: Kanada, Bosnien-Hercegovina, Qatar, Schweiz ────────
  {
    teams: ['CAN', 'BIH'],
    text: 'Kanada har hemmaplan och sin bästa trupp hittills. Bosnien kommer med självförtroende efter playoff. Jämnt, men knapp kanadensisk fördel.',
  },
  {
    teams: ['CAN', 'QAT'],
    text: 'Kanada har högre tempo och mer offensiv kraft. Qatar är organiserat och tålmodigt men underdog. Kanadensisk seger är trolig.',
  },
  {
    teams: ['CAN', 'SUI'],
    text: 'Schweiz är gruppens mest stabila lag, Kanada har energi och publikstöd. Två disciplinerade lag. Oavgjort eller knapp marginal känns troligast.',
  },
  {
    teams: ['BIH', 'QAT'],
    text: 'Bosnien har mer tyngd och offensiv slagkraft. Qatar är disciplinerat men kan få problem med fysiken. Bosnisk fördel.',
  },
  {
    teams: ['BIH', 'SUI'],
    text: 'Schweiz har rutin och defensiv stabilitet, Bosnien mer framåtanda. Schweiz är något vassare på pappret. Lätt schweizisk fördel.',
  },
  {
    teams: ['QAT', 'SUI'],
    text: 'Schweiz är klart högre rankat och svårslaget i mästerskap. Qatar kan störa med struktur men saknar samma kvalitet. Schweizisk seger trolig.',
  },

  // ── Grupp C: Brasilien, Marocko, Haiti, Skottland ───────────────
  {
    teams: ['BRA', 'MAR'],
    text: 'Brasilien har högst toppnivå men skadeläget jämnar ut mötet. Marocko har VM-rutin och stark struktur. Mycket jämnt, oavgjort är möjligt.',
  },
  {
    teams: ['BRA', 'HAI'],
    text: 'Brasilien har enorm kvalitetsskillnad även med skador i truppen. Haiti är tillbaka i VM men räcker troligen inte till. Klar brasiliansk fördel.',
  },
  {
    teams: ['BRA', 'SCO'],
    text: 'Brasilien är storfavorit med mer individuell klass. Skottland är organiserat och behöver försvara kompakt. Brasiliansk seger är mest sannolik.',
  },
  {
    teams: ['MAR', 'HAI'],
    text: 'Marocko har klart mer kvalitet, rutin och VM-erfarenhet. Haiti kämpar hårt men har ett stort gap att stänga. Marockansk seger trolig.',
  },
  {
    teams: ['SCO', 'HAI'],
    text: 'Två jämna lag i gruppens nedre halva. Skottland har mer rutin och högre ranking, Haiti mer fart. Lätt skotsk fördel.',
  },
  {
    teams: ['SCO', 'MAR'],
    text: 'Marocko har högre kvalitet och semifinalrutin från 2022. Skottland är disciplinerat men får svårt med bredden. Marockansk seger troligast.',
  },

  // ── Grupp D: USA, Paraguay, Australien, Turkiet ─────────────────
  {
    teams: ['USA', 'PAR'],
    text: 'USA har hemmaplan men också defensiva frågetecken. Paraguay är disciplinerat och starkt från kvalet. Knapp USA-seger eller oavgjort känns troligast.',
  },
  {
    teams: ['USA', 'AUS'],
    text: 'USA har hemmaplan och högre kvalitet, men Australien kan störa med fysik och rutin. Små marginaler väntar. Lätt USA-fördel.',
  },
  {
    teams: ['USA', 'TUR'],
    text: 'Turkiet har spets i Güler och Çalhanoğlu, USA har publiken men en sårbar backlinje. Väldigt svårtippat: oavgjort eller knapp seger.',
  },
  {
    teams: ['PAR', 'AUS'],
    text: 'Två fysiska och organiserade lag. Paraguay hotar mer i kontringar, Australien på fasta. Jämnt, delade poäng är fullt möjligt.',
  },
  {
    teams: ['PAR', 'TUR'],
    text: 'Turkisk kreativitet möter paraguayansk disciplin. Turkiet har mer individuell spets, men Paraguay är svårt att bryta ner. Lätt turkisk fördel.',
  },
  {
    teams: ['AUS', 'TUR'],
    text: 'Turkiet har mer individuell klass, Australien mer fysik och hot på fasta. Det kan bli tätt och kampigt. Turkisk fördel, men jämnt.',
  },

  // ── Grupp E: Tyskland, Curaçao, Elfenbenskusten, Ecuador ────────
  {
    teams: ['GER', 'CUW'],
    text: 'Curaçao är en historisk VM-debutant men gapet mot Tyskland är stort. Wirtz och Musiala ger kreativ klass. Tysk seger med marginal trolig.',
  },
  {
    teams: ['GER', 'CIV'],
    text: 'Tyskland är klar favorit med bollkontroll och bredd. Elfenbenskusten har fysik och kvalitet som kan störa. Tysk seger är troligast.',
  },
  {
    teams: ['GER', 'ECU'],
    text: 'Ecuador har stark defensiv och kan pressa Tyskland mest i gruppen. Tyskland är vassare framåt, men oavgjort är möjligt.',
  },
  {
    teams: ['CUW', 'CIV'],
    text: 'Elfenbenskusten har klart mer individuell kvalitet och fysik. Curaçao är välcoachat men underlägset. Ivoriansk seger trolig.',
  },
  {
    teams: ['CUW', 'ECU'],
    text: 'Ecuador är högre rankat, defensivt stabilt och mer turneringsvant. Curaçao får svårt att stänga kvalitetsgapet. Ecuadoriansk seger trolig.',
  },
  {
    teams: ['CIV', 'ECU'],
    text: 'Jämnt möte om andraplatsen. Ecuador har stabilare defensiv, Elfenbenskusten mer offensiv kraft. Små marginaler, lätt Ecuador-fördel.',
  },

  // ── Grupp F: Nederländerna, Japan, Sverige, Tunisien ────────────
  {
    teams: ['NED', 'JPN'],
    text: 'Japan är tekniskt, snabbt och farligt. Nederländerna har mer bredd men saknar Xavi Simons kreativitet. Jämnare än rankingen säger, kryss möjligt.',
  },
  {
    teams: ['NED', 'SWE'],
    text: 'Nederländerna har mer bredd men saknar Simons. Sverige har Gyökeres som tydligt hot. Lätt holländsk fördel, men svenskt resultat är möjligt.',
  },
  {
    teams: ['NED', 'TUN'],
    text: 'Nederländerna har klart mer kvalitet, men Tunisien är kompakt och svårforcerat. Holländarna behöver tålamod. Seger trolig, men knapp.',
  },
  {
    teams: ['JPN', 'SWE'],
    text: 'Japans tempo och teknik möter svensk fysik och Gyökeres spets. Sverige hotar på fasta. Väldigt jämnt och lär avgöras av detaljer.',
  },
  {
    teams: ['JPN', 'TUN'],
    text: 'VM-historiens 1000:e match. Japan har rörlighet, teknik och bättre individer; Tunisien struktur och disciplin. Japansk seger, men knappt.',
  },
  {
    teams: ['SWE', 'TUN'],
    text: 'Sverige har mer offensiv kraft genom Gyökeres. Tunisien försvarar kompakt och lågt. Sverige bör föra spelet, knapp svensk seger troligast.',
  },

  // ── Grupp G: Belgien, Egypten, Iran, Nya Zeeland ────────────────
  {
    teams: ['BEL', 'EGY'],
    text: 'Belgien har mer bredd och högre ranking, Egypten lutar sig mot Salah. Hans form avgör hur jämnt det blir. Belgisk fördel, men Egypten kan störa.',
  },
  {
    teams: ['BEL', 'IRN'],
    text: 'Belgien har klart mer individuell kvalitet. Iran är organiserat, lågt och kontringsstarkt men saknar samma spets. Belgisk seger trolig.',
  },
  {
    teams: ['BEL', 'NZL'],
    text: 'Belgien har ett stort kvalitetsövertag över hela planen. Nya Zeeland lär kämpa hårt men gapet är tydligt. Belgisk seger med marginal.',
  },
  {
    teams: ['EGY', 'IRN'],
    text: 'Två rutinerade och defensivt starka lag. Egypten är vassare med Salah, Iran svårslaget bakåt. Jämnt, med lätt egyptisk fördel.',
  },
  {
    teams: ['EGY', 'NZL'],
    text: 'Egypten är högre rankat och har Salah som kan avgöra själv. Nya Zeeland är arbetsamt men svagare offensivt. Egyptisk seger trolig.',
  },
  {
    teams: ['IRN', 'NZL'],
    text: 'Iran är mer rutinerat, bättre organiserat och högre rankat. Nya Zeeland kämpar men skapar för lite. Iransk seger är troligast.',
  },

  // ── Grupp H: Spanien, Kap Verde, Saudiarabien, Uruguay ──────────
  {
    teams: ['ESP', 'CPV'],
    text: 'Spanien är regerande Europamästare och har enorm kvalitet mot debutanten Kap Verde. Yamal väntas spelklar. Spansk seger med marginal trolig.',
  },
  {
    teams: ['ESP', 'KSA'],
    text: 'Spanien har stort övertag i bollinnehav och kvalitet. Saudiarabien kan skrälla, men behöver en perfekt dag. Spansk seger klart troligast.',
  },
  {
    teams: ['ESP', 'URU'],
    text: 'Gruppens toppmatch: spansk bollkontroll mot Uruguays tyngd, defensiv och kontringar. Mycket jämnt, oavgjort är fullt möjligt.',
  },
  {
    teams: ['CPV', 'KSA'],
    text: 'Två jämna lag i gruppens nedre halva. Saudiarabien har mer turneringsrutin, Kap Verde debuterar. Små marginaler, lätt saudisk fördel.',
  },
  {
    teams: ['CPV', 'URU'],
    text: 'Uruguay har klart mer kvalitet, rutin och tyngd på alla linjer. Kap Verde är energiskt men underlägset. Uruguayansk seger trolig.',
  },
  {
    teams: ['KSA', 'URU'],
    text: 'Uruguay försvarar tight och kontrar vasst, vilket passar mot Saudiarabien. Saudierna kan överraska, men Uruguay har fördel.',
  },

  // ── Grupp I: Frankrike, Senegal, Norge, Irak (Dödens grupp) ─────
  {
    teams: ['FRA', 'SEN'],
    text: 'Frankrike har bredden och världsklassen, Senegal fysiken och farten för att störa. Repris med skrällkänsla. Fransk fördel, men varning.',
  },
  {
    teams: ['FRA', 'NOR'],
    text: 'Frankrike har större bredd, men Norge har Haaland och Ødegaard som kan avgöra allt. Norge hotar mest i öppna ytor. Fransk fördel.',
  },
  {
    teams: ['FRA', 'IRQ'],
    text: 'Frankrike har ett enormt kvalitetsövertag. Irak är tillbaka efter lång väntan och behöver försvara kompakt. Fransk seger med marginal trolig.',
  },
  {
    teams: ['SEN', 'NOR'],
    text: 'Senegals fysik och fart möter Haalands målhot och Ødegaards blick. Båda har slagkraft men luckor bakåt. Mycket jämnt, kryss möjligt.',
  },
  {
    teams: ['SEN', 'IRQ'],
    text: 'Senegal har mer kvalitet, fart och fysik på de flesta positioner. Irak är tåligt men svagare framåt. Senegalesisk seger troligast.',
  },
  {
    teams: ['NOR', 'IRQ'],
    text: 'Norge har Haaland och Ødegaard, ett övertag Irak får svårt att hantera. Irak lär försvara lågt och kontra. Norsk seger trolig.',
  },

  // ── Grupp J: Argentina, Algeriet, Österrike, Jordanien ──────────
  {
    teams: ['ARG', 'ALG'],
    text: 'Argentina har världsmästarkvalitet och flera matchvinnare. Algeriet är rutinerat men underlägset i spets. Argentinsk seger är trolig.',
  },
  {
    teams: ['ARG', 'AUT'],
    text: 'Gruppens toppmöte: Argentinas klass mot Österrikes intensiva press. Österrike kan störa, men Argentina har mer spets över 90 minuter.',
  },
  {
    teams: ['ARG', 'JOR'],
    text: 'Argentina har ett mycket stort kvalitetsövertag. Jordanien är organiserat och kommer med självförtroende, men räcker troligen inte till.',
  },
  {
    teams: ['ALG', 'AUT'],
    text: 'Två organiserade lag: Österrike med fysik och press, Algeriet med teknik och spets. Små marginaler avgör. Lätt österrikisk fördel.',
  },
  {
    teams: ['ALG', 'JOR'],
    text: 'Två ganska jämna lag. Algeriet har mer rutin och kvalitet, Jordanien kommer med självförtroende. Tätt möte, lätt algerisk fördel.',
  },
  {
    teams: ['AUT', 'JOR'],
    text: 'Österrike har högre ranking och ett aggressivt presspel som kan stressa Jordanien. Jordanien är disciplinerat men underdog.',
  },

  // ── Grupp K: Portugal, DR Kongo, Uzbekistan, Colombia ───────────
  {
    teams: ['POR', 'COD'],
    text: 'Portugal har enorm stjärnbredd och är klar favorit. DR Kongo är fysiskt starkt och dramatiskt kvalat, men underlägset i kvalitet.',
  },
  {
    teams: ['POR', 'UZB'],
    text: 'Portugal har ett stort kvalitetsövertag mot debutanten Uzbekistan. Uzbekerna är välorganiserade men saknar spets. Portugisisk seger trolig.',
  },
  {
    teams: ['POR', 'COL'],
    text: 'Gruppens toppmatch. Portugal har mer bredd, Colombia kreativ spets med James och Díaz. Väldigt jämnt, oavgjort är fullt möjligt.',
  },
  {
    teams: ['COD', 'UZB'],
    text: 'Två jämna lag. DR Kongo har mer fysik och rutin, Uzbekistan mer struktur. Det kan bli tätt och avvaktande. Lätt kongolesisk fördel.',
  },
  {
    teams: ['COD', 'COL'],
    text: 'Colombia har mer individuell kvalitet och offensiv kreativitet. DR Kongo är fysiskt besvärligt och kan störa. Colombiansk fördel.',
  },
  {
    teams: ['UZB', 'COL'],
    text: 'Colombia är högre rankat och vassare på de flesta positioner. Uzbekistan debuterar och är välorganiserat men underdog.',
  },

  // ── Grupp L: England, Kroatien, Ghana, Panama ───────────────────
  {
    teams: ['ENG', 'CRO'],
    text: 'England har yngre och vassare trupp, Kroatien rutinen och Modrićs kontroll. Historiken väger tungt. Jämnt, med lätt engelsk fördel.',
  },
  {
    teams: ['ENG', 'GHA'],
    text: 'England har mer kvalitet och bredd, men Ghanas fart kan skapa problem i omställningar. Om balansen håller är engelsk seger troligast.',
  },
  {
    teams: ['ENG', 'PAN'],
    text: 'England har stort kvalitetsövertag mot ett defensivt och disciplinerat Panama. Panama behöver stå lågt och täta ytor. Engelsk seger trolig.',
  },
  {
    teams: ['CRO', 'GHA'],
    text: 'Kroatisk rutin och teknik möter ghanansk fart och fysik. Kroatien har stabilare struktur, Ghana högre intensitet. Lätt kroatisk fördel.',
  },
  {
    teams: ['CRO', 'PAN'],
    text: 'Kroatien har mer kvalitet och bollkontroll. Panama är välorganiserat och kompakt. Kroatien bör föra spelet. Kroatisk seger, men jämnt.',
  },
  {
    teams: ['GHA', 'PAN'],
    text: 'Två jämna lag. Ghana har mer fart och ligakvalitet, Panama mer taktisk disciplin. Det kan bli tätt. Lätt ghanansk fördel.',
  },
];

// Order-independent lookup: `${A}-${B}` with codes sorted alphabetically.
function pairKey(a, b) {
  return [a, b].map((c) => String(c).toUpperCase()).sort().join('-');
}

const ANALYSIS_BY_PAIR = ENTRIES.reduce((acc, { teams, text }) => {
  acc[pairKey(teams[0], teams[1])] = text;
  return acc;
}, {});

/**
 * Curated Swedish analysis for a matchup, matched by the two team codes
 * regardless of order. Returns `null` if no entry exists (e.g. knockout ties).
 */
export function getMatchAnalysis(codeA, codeB) {
  if (!codeA || !codeB) return null;
  return ANALYSIS_BY_PAIR[pairKey(codeA, codeB)] || null;
}
