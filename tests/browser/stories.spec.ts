import { expect, test } from '@playwright/test';

/**
 * Stories against the public build. They avoid asserting specific calls, which change every
 * edition; the illustrative fixtures in data/examples are covered by the unit tests.
 */

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('biggest banks');
  expect(errors).toEqual([]);
});

test('the public build shows real editions only, with no preview or draft banner', async ({
  page,
}) => {
  await expect(page.getByText('Illustrative data')).toHaveCount(0);
  await expect(page.getByText('Private draft')).toHaveCount(0);
  const latest = page.getByRole('group', { name: 'Edition' }).getByRole('button').last();
  await expect(latest).toHaveAttribute('aria-pressed', 'true');
});

test('a consensus row expands and opens the detail drawer, which returns focus on Escape', async ({
  page,
}) => {
  const row = page.locator('#consensus .m-btn').first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  const details = page
    .locator('#consensus .m-row.open')
    .getByRole('button', { name: 'Details and source' })
    .first();
  await details.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /official publication/i })).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(details).toBeFocused();
});

test('every grid cell opens a call with its source', async ({ page }) => {
  const cell = page.locator('#grid .cell').first();
  await cell.scrollIntoViewIfNeeded();
  const name = (await cell.getAttribute('aria-label')) ?? '';
  const asset = name.split(': ')[0].split(', ').slice(1).join(', ');
  await cell.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(asset);
  await expect(dialog).toContainText('Published');
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(cell).toBeFocused();
});

test('missing views are shown as missing, never as neutral', async ({ page }) => {
  const missing = page.getByRole('button', { name: /: No view published/ }).first();
  await missing.scrollIntoViewIfNeeded();
  await expect(missing).toHaveText('—');
});

test('calls taken from a broader house category carry the ≈ mark and explain it', async ({
  page,
}) => {
  const cell = page.getByRole('button', { name: /based on its “/ }).first();
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toContainText('≈');
  await cell.click();
  await expect(page.getByRole('dialog')).toContainText('Category');
  await page.keyboard.press('Escape');
});

test('filters and sorting work by keyboard', async ({ page }) => {
  const equities = page
    .getByRole('group', { name: 'Filter by asset class' })
    .getByRole('button', { name: 'Equities' });
  await equities.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#consensus .m-row')).toHaveCount(4);
  const divided = page.getByRole('button', { name: 'Most divided first' });
  await divided.focus();
  await page.keyboard.press('Enter');
  await expect(divided).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#consensus .m-row')).toHaveCount(4);
});
