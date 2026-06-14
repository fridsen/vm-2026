import { expect, test } from '@playwright/test';

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

function ignorableError(text) {
  return (
    text.includes('Failed to load resource') ||
    text.includes('net::ERR_') ||
    text.includes('favicon')
  );
}

test.describe('smoke: app boot', () => {
  test('home shows onboarding without runtime errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Gå med i VM-Tipset' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
    expect(errors.filter((e) => !ignorableError(e))).toEqual([]);
  });

  test('teletext URLs boot without runtime errors (auth gate)', async ({ page }) => {
    const errors = collectPageErrors(page);

    for (const path of ['/t/300', '/t/377', '/t/350']) {
      await page.goto(path);
      await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
    }

    expect(errors.filter((e) => !ignorableError(e))).toEqual([]);
  });

  test('invalid teletext page still boots auth gate', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/t/999');
    await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
    expect(errors.filter((e) => !ignorableError(e))).toEqual([]);
  });
});

test.describe('smoke: theme persistence (pre-auth shell)', () => {
  test('teletext theme in localStorage does not crash boot', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('vm-theme', 'teletext');
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
    expect(errors.filter((e) => !ignorableError(e))).toEqual([]);
  });
});
