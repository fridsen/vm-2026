import { GROUPS } from '../data/teams.js';

export const TELETEXT_HOME_PAGE = 300;
export const TELETEXT_MATCHER_INDEX = 337;
export const TELETEXT_LIVE_SCORES_PAGE = 377;
export const TELETEXT_TIPS_MATCH_START = 331;
export const TELETEXT_TIPS_GROUP_START = 334;
export const TELETEXT_TIPS_WINNER_PAGE = 336;
export const TELETEXT_GROUP_PAGE_START = 338;

/** Leaderboard page — teletext page 350. */
export const LEADERBOARD_PAGE = 350;

/** First page of each main section — bottom nav jump menu. */
export const TELETEXT_SECTION_NAV = [
  { page: TELETEXT_HOME_PAGE, label: 'Dashboard' },
  { page: TELETEXT_TIPS_MATCH_START, label: 'Mina tips' },
  { page: TELETEXT_MATCHER_INDEX, label: 'Matcher' },
  { page: LEADERBOARD_PAGE, label: 'Leaderboard' },
  { page: TELETEXT_LIVE_SCORES_PAGE, label: 'Målservice' },
];

export function groupPageNumber(groupLetter) {
  const index = GROUPS.indexOf(groupLetter);
  if (index < 0) return null;
  return TELETEXT_GROUP_PAGE_START + index;
}

export function groupLetterFromPage(pageNum) {
  const index = pageNum - TELETEXT_GROUP_PAGE_START;
  return index >= 0 && index < GROUPS.length ? GROUPS[index] : null;
}

export function leaderboardPageLabel() {
  return LEADERBOARD_PAGE != null ? String(LEADERBOARD_PAGE) : '---';
}
