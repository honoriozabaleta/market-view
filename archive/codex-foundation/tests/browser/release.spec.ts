import { test, expect } from '@playwright/test';

test('selected horizon stays consistent through detail, evidence, reload and return', async ({
  page,
}, testInfo) => {
  await page.goto('http://127.0.0.1:4174/market-view/#/latest');
  await page.getByLabel('Asset', { exact: true }).selectOption('us-equities');
  await page.getByLabel('Research stream', { exact: true }).selectOption('imaginary-harbor-stream');
  await page.getByRole('radio', { name: '3 months', exact: true }).check();
  const cell = page.getByRole('link', { name: /^Open Imaginary Harbor Demo Bank US equities/ });
  await expect(cell.locator('..').locator('.stance')).toHaveText('Neutral');
  if (testInfo.project.use.hasTouch) await cell.tap();
  else await cell.click();
  await expect(page.locator('.summary-ours .stance')).toHaveText('Neutral');
  await expect(page.locator('.summary-ours')).toContainText('3-month comparison');
  await page.getByRole('link', { name: 'View evidence', exact: true }).click();
  await page.getByRole('link', { name: 'Open full view detail', exact: true }).click();
  await page.reload();
  await expect(page.locator('.summary-ours .stance')).toHaveText('Neutral');
  await page.getByRole('link', { name: '← Back to comparison', exact: true }).click();
  await expect(page.getByRole('radio', { name: '3 months', exact: true })).toBeChecked();
});

test('cell accessible names contain the visible source label and counts retain their denominator', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4173/#/latest');
  await page.getByLabel('Asset', { exact: true }).selectOption('us-equities');
  await page.getByLabel('Display status').selectOption('favorable');
  const link = page.getByRole('link', {
    name: /^Open Paper Moon Fictional Asset Management US equities/,
  });
  const statement = (await link.innerText()).trim();
  await expect(link).toHaveAccessibleName(new RegExp(statement));
  const counts = page.locator('table.counts tbody tr');
  await expect(counts).toHaveCount(1);
  await expect(counts).toContainText('2 of 3 streams');
  await expect(counts).toContainText('1/2');
});

test('status explanations and tablet scroll controls remain operable', async ({
  page,
}, testInfo) => {
  await page.goto('http://127.0.0.1:4173/#/latest');
  const statusKey = page.locator('.key-toggle > summary');
  if (testInfo.project.use.hasTouch) await statusKey.tap();
  else {
    await statusKey.focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.key-toggle')).toHaveAttribute('open', '');
  await expect(page.locator('.status-key')).toContainText('Absence is not neutral.');
  if (testInfo.project.use.hasTouch) await statusKey.tap();
  else {
    await statusKey.focus();
    await page.keyboard.press('Enter');
  }

  if (testInfo.project.use.viewport?.width === 820) {
    const region = page.getByRole('region', { name: 'Research comparison matrix' });
    const next = page.getByRole('button', { name: 'Scroll to later assets' });
    await expect(next).toBeEnabled();
    await next.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const previous = page.getByRole('button', { name: 'Scroll to earlier assets' });
    await expect(previous).toBeEnabled();
    await previous.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeLessThanOrEqual(1);
    await expect(previous).toBeDisabled();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
