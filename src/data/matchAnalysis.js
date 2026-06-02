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
    text: 'Mexiko är klart högre rankat och har hemmaplansfördel, medan Sydafrika återvänder till VM efter lång frånvaro. Mexiko var obesegrat i marsmatcherna (0–0 mot Portugal, 1–1 mot Belgien) men har en osäker målvaktssituation efter Malagóns hälseneskada. Mötet är en repris på VM 2010 med samma två förbundskaptener. Mexikansk seger är det mest sannolika utfallet.',
  },
  {
    teams: ['MEX', 'KOR'],
    text: 'Två rutinerade VM-nationer där Mexiko har publiken och Sydkorea har individuell toppkvalitet i Son Heung-min (33) och Kim Min-jae. Det blir sannolikt jämnt, med koreansk kontringsfart som främsta hot mot mexikansk bollkontroll. Liten mexikansk fördel, men oavgjort är fullt möjligt.',
  },
  {
    teams: ['MEX', 'CZE'],
    text: 'Mexiko är favorit med hemmaplan och bredd; Tjeckien kom in via straffseger mot Danmark i playoff och är välorganiserat. Tjeckiens styrka är struktur snarare än individuell briljans. Knapp mexikansk seger är troligast.',
  },
  {
    teams: ['RSA', 'KOR'],
    text: 'Sydkorea är högre rankat och har mer slagkraft framåt genom Son. Sydafrika är defensivt tåligt men har svårare att skapa farlighet. Sydkoreansk fördel.',
  },
  {
    teams: ['KOR', 'CZE'],
    text: 'Jämn match mellan två organiserade lag; Korea har stjärnglansen i Son medan Tjeckien förlitar sig på kollektivet. Små marginaler lär avgöra. Lätt koreansk fördel.',
  },
  {
    teams: ['CZE', 'RSA'],
    text: 'Tjeckien är tyngre på pappret och mer meriterat på senare år. Sydafrika är svårforcerat men producerar lite offensivt. Knapp tjeckisk seger är det mest sannolika.',
  },

  // ── Grupp B: Kanada, Bosnien-Hercegovina, Qatar, Schweiz ────────
  {
    teams: ['CAN', 'BIH'],
    text: 'Kanada spelar på hemmaplan med sin starkaste trupp någonsin (Davies, Jonathan David, Eustáquio), medan Bosnien kommer med stort självförtroende efter att ha slagit ut Italien. Publiktrycket i Toronto är en reell faktor. Det blir jämnt, med en knapp kanadensisk fördel.',
  },
  {
    teams: ['CAN', 'QAT'],
    text: 'Kanada är högre rankat och har mer dynamik framåt; Qatar är asiatiska mästare 2023 men underdog här. Qatars styrka ligger i organisation och tålamod. Kanadensisk seger är trolig.',
  },
  {
    teams: ['CAN', 'SUI'],
    text: 'Schweiz är gruppens mest stabila lag och tappar sällan poäng i mästerskap, medan Kanada har energin och en publik på sin sida. Två välorganiserade lag som tar få risker. Delade poäng eller en mycket knapp marginal är troligast.',
  },
  {
    teams: ['BIH', 'QAT'],
    text: 'Bosnien har mer europeisk tyngd och slagkraft; Qatar är disciplinerat men har svårt mot fysiskt starka lag. Bosnisk fördel.',
  },
  {
    teams: ['BIH', 'SUI'],
    text: 'Schweizisk rutin och defensiv stabilitet möter bosnisk revanschlust och framåtanda. Schweiz är marginellt vassare på pappret. Jämnt, med lätt schweizisk fördel.',
  },
  {
    teams: ['QAT', 'SUI'],
    text: 'Schweiz är klart högre rankat och svårslaget i turneringsspel. Qatar kan göra det jobbigt med struktur men saknar samma kvalitet. Schweizisk seger trolig.',
  },

  // ── Grupp C: Brasilien, Marocko, Haiti, Skottland ───────────────
  {
    teams: ['BRA', 'MAR'],
    text: 'En tidig tungviktsmatch: Marocko blev fyra i VM 2022 som första afrikanska semifinalist och är inget enkelt motstånd. Brasilien dras med skadekris (Militão borta, allvarlig hamstringskada på Estêvão, oklara Rodrygo och Cunha), medan Hakimi väntas spelklar för Marocko. Det jämnar ut en match som annars hade haft Brasilien som klar favorit. Mycket jämnt – oavgjort eller knapp marockansk skräll är fullt tänkbart.',
  },
  {
    teams: ['BRA', 'HAI'],
    text: 'Brasilien har en enorm kvalitetsmässig övervikt även med ett decimerat lag; Haiti spelar sitt första VM sedan 1974. Skillnaden i individuell klass är markant. Brasiliansk seger med marginal är trolig.',
  },
  {
    teams: ['BRA', 'SCO'],
    text: 'Brasilien är storfavorit; Skottland (Robertson, McTominay, Gilmour) är välorganiserat men underlägset i individuell kvalitet. Skottlands bästa väg är ett tätt, disciplinerat försvarsspel. Brasiliansk seger är det mest sannolika.',
  },
  {
    teams: ['MAR', 'HAI'],
    text: 'Marocko är ett topp-tio-lag i världen med betydligt mer kvalitet och rutin. Haiti kämpar men har ett tydligt kvalitetsgap att överbrygga. Marockansk seger trolig.',
  },
  {
    teams: ['SCO', 'HAI'],
    text: 'Två jämna lag i gruppens nedre halva; Skottland har högre rankning och mer Premier League-rutin. Haiti har fart men är mindre konsekvent. Skotsk fördel.',
  },
  {
    teams: ['SCO', 'MAR'],
    text: 'Marocko är ett steg upp i kvalitet och har semifinalrutin från 2022. Skottland är taktiskt disciplinerat men har svårt att matcha marockansk bredd. Marockansk seger är troligast.',
  },

  // ── Grupp D: USA, Paraguay, Australien, Turkiet ─────────────────
  {
    teams: ['USA', 'PAR'],
    text: 'USA spelar hemma men kommer med frågetecken efter två marsförluster (mot Belgien och Portugal, 2–7 totalt) som blottade brister i tremannaförsvaret; Dest är tillbaka men Agyemang missar VM. Paraguay är taktiskt disciplinerat och avslutade Sydamerika-kvalet starkt. Hemmapublik talar för USA. Knapp USA-seger eller oavgjort är troligast.',
  },
  {
    teams: ['USA', 'AUS'],
    text: 'USA har högre kvalitet och hemmaplan, men Australiens fysik och turneringsrutin kan störa ett osäkert amerikanskt försvar. Det blir sannolikt en kamp där marginalerna är små. Lätt USA-fördel.',
  },
  {
    teams: ['USA', 'TUR'],
    text: 'Turkiet (i sitt första VM sedan trean 2002) har stark individuell kvalitet i Arda Güler och Çalhanoğlu, medan USA har publiken men en sårbar baklinje. En av gruppens jämnaste och mest svårtippade matcher. Oavgjort eller knapp seger åt endera hållet.',
  },
  {
    teams: ['PAR', 'AUS'],
    text: 'Två fysiska, organiserade lag med begränsad offensiv spets. Paraguay är något vassare på kontringar, Australien farligare på fasta situationer. Jämnt, delade poäng är fullt möjligt.',
  },
  {
    teams: ['PAR', 'TUR'],
    text: 'Turkisk kreativitet och teknisk kvalitet mot paraguayansk struktur och disciplin. Turkiet har de bättre individerna. Lätt turkisk fördel.',
  },
  {
    teams: ['AUS', 'TUR'],
    text: 'Turkiet har mer individuell klass, men Australien är fysiskt och svårspelat och kan utmana på fasta situationer. Det kan bli en närkampsbetonad match. Turkisk fördel, men jämnt.',
  },

  // ── Grupp E: Tyskland, Curaçao, Elfenbenskusten, Ecuador ────────
  {
    teams: ['GER', 'CUW'],
    text: 'Curaçao är den minsta nationen (folkmängd) som någonsin kvalat till VM, coachad av Dick Advocaat – men kvalitetsgapet mot Tyskland är mycket stort. Tyskland saknar Gnabry men har kreativ klass i Wirtz och Musiala. Tysk seger med marginal är det troliga.',
  },
  {
    teams: ['GER', 'CIV'],
    text: 'Tyskland är klar favorit, men Elfenbenskusten har Premier League-kvalitet och fysik som kan ställa till det stundtals. Tysk bollkontroll mot ivoriansk atletism. Tysk seger är troligast.',
  },
  {
    teams: ['GER', 'ECU'],
    text: 'Ecuador har en stark defensiv bas och bedöms vara det lag som kan pressa Tyskland mest. Tyskland är vassare offensivt men kan ha svårt att bryta ner ett välorganiserat sydamerikanskt försvar. Tysk fördel, men oavgjort är möjligt.',
  },
  {
    teams: ['CUW', 'CIV'],
    text: 'Elfenbenskusten har betydligt mer individuell kvalitet och fysik. Curaçao är välcoachat men underlägset på de flesta positioner. Ivoriansk seger trolig.',
  },
  {
    teams: ['CUW', 'ECU'],
    text: 'Ecuador är högre rankat och defensivt solitt med mer turneringskvalitet. Curaçao kämpar men har ett tydligt gap att hantera. Ecuadoriansk seger är troligast.',
  },
  {
    teams: ['CIV', 'ECU'],
    text: 'En jämn match om vilket lag som bäst utmanar Tyskland; Ecuador har den stabilare defensiven, Elfenbenskusten den vassare offensiven. Små marginaler avgör. Lätt Ecuador-fördel.',
  },

  // ── Grupp F: Nederländerna, Japan, Sverige, Tunisien ────────────
  {
    teams: ['NED', 'JPN'],
    text: 'Japan slog både Tyskland och Spanien i VM 2022 och vann 1–0 borta mot England i mars 2026 – ett tekniskt och farligt lag. Nederländerna tappade Xavi Simons (korsband) vilket försvagar kreativiteten i en redan tunn mittfältsuppställning. Det gör matchen jämnare än rankingen antyder. Oavgjort är fullt möjligt.',
  },
  {
    teams: ['NED', 'SWE'],
    text: 'Utan Xavi Simons är Nederländerna mer sårbara på mittfältet, och Sverige har en avgörare i Viktor Gyökeres som är i målform efter två playoffmatcher. Holländarna har mer bredd, men Sverige kan göra det till en jämn tillställning. Lätt holländsk fördel, men ett svenskt resultat är inom räckhåll.',
  },
  {
    teams: ['NED', 'TUN'],
    text: 'Nederländerna har klart mer kvalitet, medan Tunisien är defensivt välorganiserat och svårforcerat. Tålamod krävs av holländarna mot ett kompakt försvar. Holländsk seger är troligast, men knappt.',
  },
  {
    teams: ['JPN', 'SWE'],
    text: 'En av gruppens jämnaste matcher: japansk rörlighet och tempo mot svensk fysik och Gyökeres slagkraft. Japan har god form, men Sverige är svårspelat och farligt på fasta situationer. Mycket jämnt – kan avgöras av detaljer.',
  },
  {
    teams: ['JPN', 'TUN'],
    text: 'Detta blir VM-historiens 1000:e match. Japans rörlighet och teknik mot tunisisk struktur och disciplin; japanerna har de bättre individerna. Japansk seger är troligast, men knappt.',
  },
  {
    teams: ['SWE', 'TUN'],
    text: 'Sverige har mer offensiv slagkraft genom Gyökeres, medan Tunisien förlitar sig på ett kompakt, tåligt försvar. Sverige bör bära spelet men måste vara tålmodigt mot ett lag som gärna släpper initiativet. Knapp svensk seger är troligast.',
  },

  // ── Grupp G: Belgien, Egypten, Iran, Nya Zeeland ────────────────
  {
    teams: ['BEL', 'EGY'],
    text: 'Belgiens guldgeneration (De Bruyne, Lukaku, Doku) får en sista chans och är gruppens högst rankade lag, medan Egypten lutar sig mot Mohamed Salah, som väntas tillbaka efter en hamstringskada. Salahs form avgör hur jämn matchen blir. Belgisk fördel, men Egypten kan utmana.',
  },
  {
    teams: ['BEL', 'IRN'],
    text: 'Belgien har klart mer individuell kvalitet; Iran är defensivt tåligt och organiserat och kan göra det surt. Iran spelar gärna lågt och kontrar. Belgisk seger trolig.',
  },
  {
    teams: ['BEL', 'NZL'],
    text: 'Belgien har en mycket stor kvalitetsmässig övervikt. Nya Zeeland kämpar men har ett tydligt gap att överbrygga. Belgisk seger med marginal.',
  },
  {
    teams: ['EGY', 'IRN'],
    text: 'Två rutinerade, defensivt starka lag – en klassiskt jämn drabbning där små marginaler avgör. Egypten är vassare med ett friskt Salah, Iran är svårslaget bakåt. Jämnt, med lätt egyptisk fördel.',
  },
  {
    teams: ['EGY', 'NZL'],
    text: 'Egypten är högre rankat och har i Salah en spelare som kan avgöra på egen hand. Nya Zeeland är arbetsamt men underlägset offensivt. Egyptisk seger trolig.',
  },
  {
    teams: ['IRN', 'NZL'],
    text: 'Iran är mer rutinerat och organiserat med högre rankning. Nya Zeeland kämpar väl men har svårt att skapa farlighet. Iransk seger är troligast.',
  },

  // ── Grupp H: Spanien, Kap Verde, Saudiarabien, Uruguay ──────────
  {
    teams: ['ESP', 'CPV'],
    text: 'Spanien är regerande Europamästare och världstvåa mot debutanten Kap Verde. Lamine Yamal hann skada hamstringen men väntas spelklar. Kvalitetsskillnaden är mycket stor. Spansk seger med marginal är trolig.',
  },
  {
    teams: ['ESP', 'KSA'],
    text: 'Spanien har en kraftig övervikt i bollinnehav och kvalitet, men Saudiarabien chockade Argentina i VM 2022 och ska inte underskattas. Saudierna behöver en perfekt dag och spansk ineffektivitet. Spansk seger är klart troligast.',
  },
  {
    teams: ['ESP', 'URU'],
    text: 'Gruppens troliga toppmatch: spansk bollkontroll mot uruguayansk defensiv stabilitet och kontringsstyrka (Valverde, Núñez, Ugarte). Uruguay har rutinen och tyngden att stå emot. Jämnt – ett av gruppspelets mest intressanta möten, oavgjort är möjligt.',
  },
  {
    teams: ['CPV', 'KSA'],
    text: 'Två jämna lag i gruppens nedre halva; Saudiarabien har mer turneringsrutin medan Kap Verde debuterar. Små marginaler avgör. Lätt saudisk fördel.',
  },
  {
    teams: ['CPV', 'URU'],
    text: 'Uruguay har betydligt mer kvalitet och rutin på alla linjer. Kap Verde är energiskt men underlägset. Uruguayansk seger trolig.',
  },
  {
    teams: ['KSA', 'URU'],
    text: 'Uruguay försvarar tight och kontrar vasst, vilket passar mot ett Saudiarabien som gärna har bollen. Saudierna kan dock överraska, vilket VM 2022 visade. Uruguayansk fördel.',
  },

  // ── Grupp I: Frankrike, Senegal, Norge, Irak (Dödens grupp) ─────
  {
    teams: ['FRA', 'SEN'],
    text: 'En laddad repris på chocken i VM 2002, då Senegal slog ut regerande mästaren Frankrike. Frankrike är världsetta och 2022-finalist (Mbappé, Doué, Cherki, Olise) men tappade Ekitike till skada, medan Senegal är bland Afrikas starkaste och avancerat från gruppen i sina två senaste VM. Skillnaden i bredd talar för Frankrike, men Senegal har fysiken och farten att överraska. Fransk fördel, med tydlig skrällvarning.',
  },
  {
    teams: ['FRA', 'NOR'],
    text: 'Norge har två världsklasspelare i Haaland och Ødegaard som kan avgöra vilken match som helst, men Frankrike har djupet och bredden. Norge är farligast i en öppen match. Fransk fördel, men Norge kan utmana om Haaland får lägen.',
  },
  {
    teams: ['FRA', 'IRQ'],
    text: 'Frankrike har en mycket stor kvalitetsmässig övervikt; Irak är tillbaka i VM efter 40 år, coachat av Graham Arnold. Irakiernas bästa väg är ett kompakt, disciplinerat försvarsspel. Fransk seger med marginal är trolig.',
  },
  {
    teams: ['SEN', 'NOR'],
    text: 'En av gruppspelets mest jämna och laddade matcher: senegalesisk fysik och fart mot Haalands målfarlighet och Ødegaards speluppfattning. Båda lagen har slagkraft men kan vara sårbara bakåt. Mycket jämnt – kan sluta oavgjort.',
  },
  {
    teams: ['SEN', 'IRQ'],
    text: 'Senegal har klart mer kvalitet och fysik på de flesta positioner. Irak är tåligt men underlägset offensivt. Senegalesisk seger är troligast.',
  },
  {
    teams: ['NOR', 'IRQ'],
    text: 'Norge har i Haaland och Ødegaard ett kvalitetsövertag som är svårt för Irak att hantera. Irak försvarar lågt och hoppas på kontringar. Norsk seger trolig.',
  },

  // ── Grupp J: Argentina, Algeriet, Österrike, Jordanien ──────────
  {
    teams: ['ARG', 'ALG'],
    text: 'Regerande världsmästaren med Messi (38), Lautaro, Álvarez och Enzo Fernández mot ett rutinerat men underlägset Algeriet. Argentina hade en stark uppladdning (2–1 mot Mauretanien, 5–0 mot Zambia). Kvalitetsskillnaden är betydande. Argentinsk seger är trolig.',
  },
  {
    teams: ['ARG', 'AUT'],
    text: 'Gruppens troliga toppmöte: argentinsk individuell klass mot Österrikes intensiva högpressspel under Ralf Rangnick. Österrike kan störa men har svårt att hålla emot över 90 minuter. Argentinsk seger, men Österrike testar dem.',
  },
  {
    teams: ['ARG', 'JOR'],
    text: 'Argentina har en mycket stor övervikt; Jordanien debuterar i VM men nådde Asiatiska mästerskapets final 2024. Jordanierna är organiserade men underlägsna i kvalitet. Argentinsk seger med marginal trolig.',
  },
  {
    teams: ['ALG', 'AUT'],
    text: 'En jämn match mellan två organiserade lag; Österrike har mer fysik och pressspel, Algeriet mer teknisk individuell kvalitet. Små marginaler avgör. Lätt österrikisk fördel.',
  },
  {
    teams: ['ALG', 'JOR'],
    text: 'Två relativt jämbördiga lag; Algeriet har mer rutin och kvalitet, Jordanien kommer med självförtroende. Det kan bli tätt. Lätt algerisk fördel.',
  },
  {
    teams: ['AUT', 'JOR'],
    text: 'Österrike har högre rankning och ett aggressivt presspel som kan överbelasta Jordanien. Jordanien är disciplinerat men underlägset. Österrikisk seger är troligast.',
  },

  // ── Grupp K: Portugal, DR Kongo, Uzbekistan, Colombia ───────────
  {
    teams: ['POR', 'COD'],
    text: 'Portugal har stjärnbredd (Ronaldo, Bruno Fernandes, Bernardo Silva, Leão) och är klar favorit, medan DR Kongo (Wissa, Tuanzebe) kvalade in dramatiskt. Kongoleserna är fysiskt starka men underlägsna i kvalitet. Portugisisk seger trolig.',
  },
  {
    teams: ['POR', 'UZB'],
    text: 'Portugal har en mycket stor kvalitetsmässig övervikt mot VM-debutanten Uzbekistan. Uzbekerna är välorganiserade men saknar samma individuella klass. Portugisisk seger med marginal trolig.',
  },
  {
    teams: ['POR', 'COL'],
    text: 'Gruppens troliga toppmatch mellan två jämna lag; Colombia är världs-13:a med kreativ kvalitet i James Rodríguez och Luis Díaz. Portugal har mer bredd, men Colombia kan vinna gruppen rakt av. Mycket jämnt – oavgjort är fullt möjligt.',
  },
  {
    teams: ['COD', 'UZB'],
    text: 'Två jämna lag; DR Kongo har mer fysik och Premier League-rutin, Uzbekistan mer struktur. Det kan bli tätt och avvaktande. Lätt kongolesisk fördel.',
  },
  {
    teams: ['COD', 'COL'],
    text: 'Colombia har klart mer individuell kvalitet och offensiv kreativitet. DR Kongo är fysiskt besvärligt och kan störa. Colombiansk fördel.',
  },
  {
    teams: ['UZB', 'COL'],
    text: 'Colombia är högre rankat och vassare på de flesta positioner. Uzbekistan debuterar och är välorganiserat men underlägset. Colombiansk seger är troligast.',
  },

  // ── Grupp L: England, Kroatien, Ghana, Panama ───────────────────
  {
    teams: ['ENG', 'CRO'],
    text: 'Tung historik: Kroatien slog ut England i semifinalen 2018. England kvalade med perfekt facit under Tuchel (8 vinster, 22 gjorda, 0 insläppta) men föll 0–1 mot Japan i mars, medan Modrić (40) fortfarande styr Kroatiens spel. England har den yngre, vassare truppen; Kroatien rutinen. Jämnt, med lätt engelsk fördel.',
  },
  {
    teams: ['ENG', 'GHA'],
    text: 'England har högre kvalitet och bredd, men Ghanas fart kan skapa problem på omställningar. Engelsmännen bör kontrollera matchen om de behåller balansen bakåt. Engelsk seger är troligast.',
  },
  {
    teams: ['ENG', 'PAN'],
    text: 'England har en stor kvalitetsmässig övervikt mot ett disciplinerat, defensivt Panama. Panamas väg är att stå lågt och täta ytor. Engelsk seger trolig.',
  },
  {
    teams: ['CRO', 'GHA'],
    text: 'Kroatisk rutin och tekniskt mittfältsspel mot ghanansk fart och fysik. Kroatien har den stabilare strukturen, Ghana den högre intensiteten. Lätt kroatisk fördel.',
  },
  {
    teams: ['CRO', 'PAN'],
    text: 'Kroatien har mer kvalitet och bollkontroll; Panama är välorganiserat och svårspelat. Kroatien bör bära spelet mot ett kompakt försvar. Kroatisk seger, men jämnt.',
  },
  {
    teams: ['GHA', 'PAN'],
    text: 'Två jämna lag; Ghana har mer fart och Premier League-kvalitet, Panama mer taktisk disciplin. Det kan bli en tät match. Lätt ghanansk fördel.',
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
