import { getMatchDayKey } from './matchSchedule.js';

/** Day section to align with the top when opening the leaderboard player sheet. */
export function leaderboardSheetScrollDayKey(days, now = Date.now()) {
  if (!days?.length) return null;

  const todayKey = getMatchDayKey(new Date(now).toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getMatchDayKey(yesterday.toISOString());

  if (days.some((day) => day.dayKey === yesterdayKey)) return yesterdayKey;

  const beforeToday = days.filter((day) => day.dayKey < todayKey);
  if (beforeToday.length > 0) return beforeToday[beforeToday.length - 1].dayKey;

  return days[0].dayKey;
}

/** Scroll a child section to the top of a scroll container without affecting the page. */
export function scrollSectionToTop(container, section) {
  if (!container || !section) return;

  const top =
    section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
}
