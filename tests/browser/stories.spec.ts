import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('biggest banks');
  expect(errors).toEqual([]);
});

test('shows the illustrative-data notice and the latest edition', async ({ page }) => {
  await expect(page.getByRole('note').first()).toContainText('Illustrative data');
  await expect(
    page
      .getByRole('group', { name: 'Edition' })
      .getByRole('button', { name: 'Q4 2026', pressed: true }),
  ).toBeVisible();
});

test('consensus row expands and opens the detail drawer, which returns focus on Escape', async ({
  page,
}) => {
  const row = page.locator('#consensus .m-btn').filter({ hasText: 'US dollar' });
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  const details = page
    .locator('#exp-us-dollar')
    .getByRole('button', { name: 'Details and source' })
    .first();
  await details.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'US dollar' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: /official publication/i })).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(details).toBeFocused();
});

test('grid cell opens the call with its original wording', async ({ page }) => {
  const cell = page.getByRole('button', { name: /^UBS, Gold: Most attractive/ });
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  await expect(page.getByRole('dialog')).toContainText('Most attractive');
  await expect(page.getByRole('dialog')).toContainText('Strong overweight');
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(cell).toBeFocused();
});

test('missing views are shown as missing, never as neutral', async ({ page }) => {
  const cell = page.getByRole('button', {
    name: /^Goldman Sachs, Japanese equities: No view published/,
  });
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toHaveText('—');
});

test('switching edition recomputes the page', async ({ page }) => {
  const editions = page.getByRole('group', { name: 'Edition' });
  await editions.getByRole('button', { name: 'Q3 2026', exact: true }).click();
  await expect(editions.getByRole('button', { name: 'Q3 2026', pressed: true })).toBeVisible();
  await expect(page.locator('.eyebrow')).toContainText('Q3 2026 Edition');
  await expect(page.getByText('first edition in the archive')).toBeVisible();
  await editions.getByRole('button', { name: 'Q4 2026', exact: true }).click();
  await expect(page.getByText(/calls changed vs Q3 2026/)).toBeVisible();
});

test('filters and sorting work by keyboard', async ({ page }) => {
  const equities = page
    .getByRole('group', { name: 'Filter by asset class' })
    .getByRole('button', { name: 'Equities' });
  await equities.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#consensus .m-row')).toHaveCount(4);
  await page.getByRole('button', { name: 'Most divided first' }).click();
  await expect(page.locator('#consensus .m-row').first()).toContainText('EM equities');
});
