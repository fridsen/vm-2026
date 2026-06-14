import {
  LEADERBOARD_PAGE,
  TELETEXT_GROUP_PAGE_START,
  TELETEXT_HOME_PAGE,
  TELETEXT_LIVE_SCORES_PAGE,
  TELETEXT_MATCHER_INDEX,
  TELETEXT_TIPS_GROUP_START,
  TELETEXT_TIPS_MATCH_START,
  TELETEXT_TIPS_WINNER_PAGE,
  groupLetterFromPage,
} from './constants.js';

const ORDERED_PAGES = [
  TELETEXT_HOME_PAGE,
  TELETEXT_TIPS_MATCH_START,
  TELETEXT_TIPS_MATCH_START + 1,
  TELETEXT_TIPS_MATCH_START + 2,
  TELETEXT_TIPS_GROUP_START,
  TELETEXT_TIPS_GROUP_START + 1,
  TELETEXT_TIPS_WINNER_PAGE,
  TELETEXT_MATCHER_INDEX,
  ...Array.from({ length: 12 }, (_, i) => TELETEXT_GROUP_PAGE_START + i),
  TELETEXT_LIVE_SCORES_PAGE,
];

if (LEADERBOARD_PAGE != null) {
  ORDERED_PAGES.splice(1, 0, LEADERBOARD_PAGE);
}

const PAGE_TITLES = {
  [TELETEXT_HOME_PAGE]: 'VM-TIPSET 2026',
  [TELETEXT_MATCHER_INDEX]: 'MATCHER',
  [TELETEXT_LIVE_SCORES_PAGE]: 'MÅLSERVICE',
  [TELETEXT_TIPS_WINNER_PAGE]: 'TIPPNING - VINNARE',
};

for (let page = TELETEXT_TIPS_MATCH_START; page <= TELETEXT_TIPS_MATCH_START + 2; page += 1) {
  PAGE_TITLES[page] = 'TIPPNING - MATCHER';
}
for (let page = TELETEXT_TIPS_GROUP_START; page <= TELETEXT_TIPS_GROUP_START + 1; page += 1) {
  PAGE_TITLES[page] = 'TIPPNING - GRUPPSPEL';
}

for (let i = 0; i < 12; i += 1) {
  const page = TELETEXT_GROUP_PAGE_START + i;
  const group = groupLetterFromPage(page);
  PAGE_TITLES[page] = `FOTBOLL VM GRUPP ${group}`;
}

export function getOrderedPages() {
  return [...ORDERED_PAGES];
}

export function getPageTitle(pageNum) {
  if (LEADERBOARD_PAGE != null && pageNum === LEADERBOARD_PAGE) {
    return 'LEADERBOARD';
  }
  return PAGE_TITLES[pageNum] ?? null;
}

export function isValidPage(pageNum) {
  return getPageTitle(pageNum) != null || pageNum === LEADERBOARD_PAGE;
}

export function getPrevPage(pageNum) {
  const idx = ORDERED_PAGES.indexOf(pageNum);
  if (idx <= 0) return null;
  return ORDERED_PAGES[idx - 1];
}

export function getNextPage(pageNum) {
  const idx = ORDERED_PAGES.indexOf(pageNum);
  if (idx < 0 || idx >= ORDERED_PAGES.length - 1) return null;
  return ORDERED_PAGES[idx + 1];
}

export function resolvePageType(pageNum) {
  if (pageNum === TELETEXT_HOME_PAGE) return 'dashboard';
  if (LEADERBOARD_PAGE != null && pageNum === LEADERBOARD_PAGE) return 'leaderboard';
  if (pageNum >= TELETEXT_TIPS_MATCH_START && pageNum <= TELETEXT_TIPS_MATCH_START + 2) {
    return 'tips-match';
  }
  if (pageNum >= TELETEXT_TIPS_GROUP_START && pageNum <= TELETEXT_TIPS_GROUP_START + 1) {
    return 'tips-group';
  }
  if (pageNum === TELETEXT_TIPS_WINNER_PAGE) return 'tips-winner';
  if (pageNum === TELETEXT_MATCHER_INDEX) return 'matcher-index';
  if (pageNum >= TELETEXT_GROUP_PAGE_START && pageNum < TELETEXT_GROUP_PAGE_START + 12) {
    return 'group-detail';
  }
  if (pageNum === TELETEXT_LIVE_SCORES_PAGE) return 'live-scores';
  return 'unknown';
}

export function getFooterVariant(pageNum) {
  const type = resolvePageType(pageNum);
  if (type === 'dashboard' || type === 'matcher-index' || type === 'group-detail' || type === 'live-scores' || type === 'leaderboard') {
    return 'section-links';
  }
  if (type === 'tips-winner') return 'tips-nav';
  if (type === 'tips-match' || type === 'tips-group') {
    return getNextPage(pageNum) ? 'continuation' : 'tips-nav';
  }
  return 'none';
}
