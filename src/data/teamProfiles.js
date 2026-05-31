// Team profiles used as ground-truth context for the LLM match analyzer.
//
// Each entry has two short, factual fields the model is allowed to lean on:
//   - `style`    — current/recent playing style in one phrase
//   - `identity` — historical reputation / what they're known for
//
// These are intentionally general — no current squad members, no specific
// recent results, no things that go stale fast. The point is to give the
// LLM real anchor facts so it doesn't invent specifics. The LLM is also
// instructed (in the prompt) to ONLY use these facts plus the bookmaker
// probabilities — no additional invention permitted.

export const TEAM_PROFILES = {
  // Group A
  MEX: {
    style: 'Energiskt mittfältsspel med snabba kantanfall',
    identity: 'Concacaf-makten, åtta raka VM-deltaganden, stark hemmaarena',
  },
  POL: {
    style: 'Direkt fysiskt spel med tonvikt på anfallsspetsen',
    identity: 'Östeuropeisk traditionsnation, beroende av sina anfallare',
  },
  SEN: {
    style: 'Atletisk fotboll med explosiv kraft i offensiven',
    identity: 'Afrikas mest framträdande lag senaste decenniet, AFCON-mästare 2021',
  },
  UZB: {
    style: 'Disciplinerad defensiv organisation, växande teknisk nivå',
    identity: 'Asiatisk uppstickare, första VM-deltagandet i ländernas historia',
  },

  // Group B
  CAN: {
    style: 'Snabbt vertikalt anfallsspel med dynamiska flygelspelare',
    identity: 'Stigande Concacaf-nation, värdland 2026, generationsbygge',
  },
  BEL: {
    style: 'Erfaret possession-baserat spel med teknisk mittfältskontroll',
    identity: '"Gyllene generationen" tonar ut, etablerad europeisk topp-nivå',
  },
  KSA: {
    style: 'Defensivt organiserade med växande individuell kvalitet',
    identity: 'Asiatiskt topplag, kända för sin uppmärksammade vinst mot Argentina 2022',
  },
  IRQ: {
    style: 'Fysiskt stridslystet spel, defensivt utgångsläge',
    identity: 'Mindre van VM-deltagare, växande regional kraft i Asien',
  },

  // Group C
  ARG: {
    style: 'Defensivt kompakt med snabba omställningar och tekniskt mittfält',
    identity: 'Regerande världsmästare 2022, känd för vinnarskalle i slutspel',
  },
  CRO: {
    style: 'Mittfältsdominerat spel med tålmodig bollhållning',
    identity: 'Tre raka VM-medaljer (2018, 2022), mental styrka i tunga matcher',
  },
  MAR: {
    style: 'Disciplinerat lagspel med kompakt defensiv och snabba kontringar',
    identity: 'Semifinalist 2022 — Afrikas och arabvärldens första; defensiv i världsklass',
  },
  JOR: {
    style: 'Kompakt defensiv med fokus på fasta situationer',
    identity: 'VM-debutant, fysiskt stridslysten, asiatisk uppstickare',
  },

  // Group D
  USA: {
    style: 'Fysiskt energiskt spel med snabba flygelspelare och hög intensitet',
    identity: 'Värdnation 2026, generationsskifte mot mer teknik och europeisk skola',
  },
  GER: {
    style: 'Possession-baserat spel med strukturerad uppbyggnad',
    identity: 'Återhämtar sig från svaga VM 2018/2022, fyrfaldig världsmästare',
  },
  KOR: {
    style: 'Tekniskt spel med snabba mittfältare och europeisk-skolade spelare',
    identity: 'Asiatiskt topplag, regelbunden VM-närvaro sedan 1986',
  },
  JAM: {
    style: 'Atletiskt spel byggt på snabbhet och fysik',
    identity: 'VM-debutant 2026, stigande Concacaf-nation',
  },

  // Group E
  FRA: {
    style: 'Komplett spel med teknisk klass och fysisk snabbhet i alla led',
    identity: 'Världsmästare 2018, finalist 2022, en av VM:s mest konstanta favoriter',
  },
  URU: {
    style: 'Fysiskt stridslystet spel med stark defensiv tradition',
    identity: 'Tvåfaldig VM-mästare, fruktade i tunga slutspelsmatcher trots mindre nation',
  },
  EGY: {
    style: 'Snabbt kontringsspel kring offensiva nyckelspelare',
    identity: 'Afrikas mest meriterade landslag, sju AFCON-titlar',
  },
  CRC: {
    style: 'Defensivt organiserat spel med erfaren bakåtkedja',
    identity: 'Kvartsfinalist 2014, känd för sin defensiva disciplin',
  },

  // Group F
  ESP: {
    style: 'Kort passningsspel med besittningsdominans och hög positionering',
    identity: 'Tiki-taka-arvet lever, EM-mästare 2024, världsmästare 2010',
  },
  NED: {
    style: 'Aggressivt anfallsspel med strukturerad uppbyggnad och hög press',
    identity: 'Klassisk holländsk skola moderniserad — total fotboll i nytt format',
  },
  CIV: {
    style: 'Fysisk kraft kombinerad med teknisk individuell kvalitet',
    identity: 'Regerande Afrika-mästare 2024, växande regional dominans',
  },
  AUS: {
    style: 'Direkt fysiskt spel, defensivt välorganiserade',
    identity: 'Asiatiskt topplag, robust och osvikligt i VM-sammanhang',
  },

  // Group G
  POR: {
    style: 'Tekniskt anfallsspel med variation på kanterna och stark mittfältskontroll',
    identity: 'EM-mästare 2016, Nations League-vinnare, generationsskifte under arbete',
  },
  SUI: {
    style: 'Defensivt välorganiserade med tålmodig spelidé',
    identity: 'Konstant slutspelsdeltagare i VM och EM, stabilt och kompakt',
  },
  IRN: {
    style: 'Kompakt defensiv med snabba kontringar',
    identity: 'Asiens mest erfarna VM-deltagare, sex VM-slutspel sedan 1978',
  },
  CPV: {
    style: 'Atletiskt direkt spel, oftast defensivt utgångsläge',
    identity: 'VM-debutant, sensationell uppstickare från Afrika',
  },

  // Group H
  ENG: {
    style: 'Fysiskt direkt spel med kreativitet på toppkanten',
    identity: 'EM-finalister 2020 och 2024, generation med slutspelsmeriter',
  },
  DEN: {
    style: 'Strukturerat spel med teknisk mittfältskontroll',
    identity: 'Stabilt nordiskt topplag, EM-mästare 1992, ofta seedat',
  },
  CMR: {
    style: 'Fysisk kraft och atletisk kvalitet på alla positioner',
    identity: 'Afrikansk traditionsnation, "De odödliga lejonen"',
  },
  PAN: {
    style: 'Defensivt kompakt fysiskt spel',
    identity: 'Concacaf-nation, andra VM-deltagandet i ländernas historia',
  },

  // Group I
  BRA: {
    style: 'Teknisk anfallsfotboll med kreativa kantspelare och kort passningsspel',
    identity: 'Femfaldig världsmästare, världens mest meriterade landslag',
  },
  SRB: {
    style: 'Offensivt spel med stark teknisk individuell kvalitet',
    identity: 'Stigande Balkan-nation med spelare i europeisk toppnivå',
  },
  ALG: {
    style: 'Tekniskt mittfältsspel kombinerat med fysisk kraft',
    identity: 'Afrika-mästare 2019, växande nordafrikansk generation',
  },
  NZL: {
    style: 'Atletiskt direkt spel, fysiskt välorganiserade',
    identity: 'Oceaniens enda regelbundna VM-deltagare',
  },

  // Group J
  ITA: {
    style: 'Defensivt strukturerat spel med teknisk mittfältskontroll',
    identity: 'Fyrfaldig världsmästare, "catenaccio"-arvet i modern tappning',
  },
  COL: {
    style: 'Tekniskt anfallsspel med snabba kantspelare',
    identity: 'Sydamerikansk topplag med kreativ tradition, Copa América-finalist 2024',
  },
  TUN: {
    style: 'Kompakt defensiv med snabba kontringar',
    identity: 'Nordafrikansk traditionsnation, sex VM-deltaganden',
  },
  QAT: {
    style: 'Tekniskt mittfältsspel med betoning på besittning',
    identity: 'Regerande Asien-mästare (2019, 2023), värdnationen i VM 2022',
  },

  // Group K
  NOR: {
    style: 'Fysisk anfallsfotboll byggd kring världsklass-anfallaren',
    identity: 'VM-debutant 2026, generation med europeiska toppspelare',
  },
  JPN: {
    style: 'Snabbt kombinationsspel med teknisk kvalitet',
    identity: 'Asiens kreativaste lag, slog både Tyskland och Spanien i VM 2022',
  },
  NGA: {
    style: 'Atletiskt fysiskt spel med snabba flygelspelare',
    identity: 'Afrikansk traditionsnation, "Super Eagles", trefaldig Afrika-mästare',
  },
  PAR: {
    style: 'Fysiskt stridslystet spel med defensiv tradition',
    identity: 'Sydamerikansk underdog med stark mental nivå',
  },

  // Group L
  TUR: {
    style: 'Tekniskt offensivt spel med europeisk struktur',
    identity: 'Stigande europeisk nation, EM-kvartsfinalister 2024',
  },
  ECU: {
    style: 'Fysiskt stridslystet spel med defensiv organisation',
    identity: 'Sydamerikansk atletisk underdog med växande ungdomsproduktion',
  },
  GHA: {
    style: 'Atletisk kraft kombinerad med teknisk variation',
    identity: 'Afrikansk traditionsnation, "Black Stars", fyrfaldig Afrika-mästare',
  },
  AUT: {
    style: 'Possession-baserat spel med strukturerad press',
    identity: 'Stigande europeisk nation, EM-åttondelsfinalister 2024',
  },
};

export function getTeamProfile(teamId) {
  return TEAM_PROFILES[teamId] || null;
}
