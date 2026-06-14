import { describe, expect, it } from 'vitest';
import { TELETEXT_HOME_PAGE } from '../../teletext/constants.js';
import { THEMES } from '../../hooks/useTheme.js';
import { resolveThemeNavigation } from './themeRedirect.js';

describe('theme redirect smoke', () => {
  const dashboard = `/t/${TELETEXT_HOME_PAGE}`;

  it('switching to teletext always lands on teletext dashboard', () => {
    expect(
      resolveThemeNavigation({
        theme: THEMES.TELETEXT,
        pathname: '/t/377',
        themeChanged: true,
      }),
    ).toBe(dashboard);

    expect(
      resolveThemeNavigation({
        theme: THEMES.TELETEXT,
        pathname: '/matcher',
        themeChanged: true,
      }),
    ).toBe(dashboard);
  });

  it('switching to default always lands on home dashboard', () => {
    expect(
      resolveThemeNavigation({
        theme: THEMES.DEFAULT,
        pathname: '/t/377',
        themeChanged: true,
      }),
    ).toBe('/');
  });

  it('teletext theme on a default route redirects to teletext dashboard', () => {
    expect(
      resolveThemeNavigation({
        theme: THEMES.TELETEXT,
        pathname: '/leaderboard',
        themeChanged: false,
      }),
    ).toBe(dashboard);
  });

  it('default theme on teletext route redirects to home', () => {
    expect(
      resolveThemeNavigation({
        theme: THEMES.DEFAULT,
        pathname: '/t/350',
        themeChanged: false,
      }),
    ).toBe('/');
  });

  it('no redirect when theme and route already match', () => {
    expect(
      resolveThemeNavigation({
        theme: THEMES.TELETEXT,
        pathname: dashboard,
        themeChanged: false,
      }),
    ).toBeNull();

    expect(
      resolveThemeNavigation({
        theme: THEMES.TELETEXT,
        pathname: '/t/377',
        themeChanged: false,
      }),
    ).toBeNull();

    expect(
      resolveThemeNavigation({
        theme: THEMES.DEFAULT,
        pathname: '/matcher',
        themeChanged: false,
      }),
    ).toBeNull();
  });
});
