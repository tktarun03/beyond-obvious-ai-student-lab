import { expect, test } from '@playwright/test';

test('learners can discover, filter and copy a complete exercise', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('link', { name: 'Open the prompt lab' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The engineering prompt lab');
  await page.getByLabel('Search exercises').fill('accessibility');
  await expect(page.getByRole('button', { name: /React accessibility review/ })).toHaveCount(1);
  await page.getByRole('button', { name: /React accessibility review/ }).click();
  await expect(page.getByLabel('Complete prompt — ready to copy')).toHaveValue(/ConfirmModal/);
  await page.getByRole('button', { name: 'Copy complete prompt' }).click();
  await expect(page.getByText('Prompt copied.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('ConfirmModal');
  await page.getByLabel('Search exercises').fill('');
  await page.getByLabel('Context', { exact: true }).selectOption('India');
  await expect(
    page.getByRole('navigation', { name: 'Prompt exercises' }).getByRole('button'),
  ).toHaveCount(4);
  await page.getByLabel('Search exercises').fill('no-exercise-like-this');
  await expect(page.getByText('No matches.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Complete prompt — ready to copy')).toHaveValue(/ConfirmModal/);
});

test('clipboard denial leaves a selectable prompt and actionable feedback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/prompt-lab');
  await page.getByRole('button', { name: 'Copy complete prompt' }).click();
  await expect(page.getByText(/Clipboard unavailable/)).toBeVisible();
  await expect(page.getByLabel('Complete prompt — ready to copy')).toBeFocused();
  const selected = await page
    .getByLabel('Complete prompt — ready to copy')
    .evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart);
  expect(selected).toBeGreaterThan(100);
});

test('small screens retain readable controls without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/prompt-lab');
  await page.getByRole('button', { name: /Payment recovery after disconnection/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Payment recovery after disconnection' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByLabel('Search exercises').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Context', { exact: true })).toBeFocused();
});
