import { describe, expect, it } from 'vitest';
import { groupLetterFromPage, groupPageNumber } from './constants.js';
import {
  getNextPage,
  getPageTitle,
  getPrevPage,
  resolvePageType,
} from './pageRegistry.js';

describe('teletext pageRegistry', () => {
  it('maps group letters to page numbers', () => {
    expect(groupPageNumber('A')).toBe(338);
    expect(groupPageNumber('L')).toBe(349);
    expect(groupLetterFromPage(338)).toBe('A');
  });

  it('resolves known page titles and types', () => {
    expect(getPageTitle(300)).toBe('VM-TIPSET 2026');
    expect(resolvePageType(300)).toBe('dashboard');
    expect(getPageTitle(337)).toBe('MATCHER');
    expect(resolvePageType(331)).toBe('tips-match');
    expect(resolvePageType(377)).toBe('live-scores');
    expect(getPageTitle(377)).toBe('MÅLSERVICE');
    expect(resolvePageType(350)).toBe('leaderboard');
    expect(getPageTitle(350)).toBe('LEADERBOARD');
  });

  it('orders prev/next navigation through tips and matcher sections', () => {
    expect(getPrevPage(331)).toBe(350);
    expect(getPrevPage(350)).toBe(300);
    expect(getNextPage(333)).toBe(334);
    expect(getNextPage(336)).toBe(337);
    expect(getNextPage(337)).toBe(338);
    expect(getNextPage(349)).toBe(377);
  });
});
