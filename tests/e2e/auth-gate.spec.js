import { expect, test } from '@playwright/test';

test('unauthenticated app shows onboarding without runtime errors', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Gå med i VM-Tipset' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();

  await page.getByRole('button', { name: 'Logga in' }).click();
  await expect(page.getByRole('button', { name: 'Tillbaka' })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
