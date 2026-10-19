import { test, expect } from '@playwright/test';
const root = 'http://127.0.0.1:4173/';
test('filter → cell → evidence → archive works from the root', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${root}#/latest`);
  await expect(page.getByRole('note')).toContainText('Demo data — not actual institutional views');
  await page.getByLabel('Asset', { exact: true }).selectOption('us-equities');
  await expect(
    page.getByRole('link', {
      name: 'Open Paper Moon Fictional Asset Management US equities',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Open .* Gold/ })).toHaveCount(0);
  const paperCell = page.getByRole('link', {
    name: 'Open Paper Moon Fictional Asset Management US equities',
    exact: true,
  });
  if (testInfo.project.use.hasTouch) await paperCell.tap();
  else await paperCell.click();
  await expect(page.getByRole('heading', { name: 'Source statement' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'Original stance:' })).toContainText(
    'Overweight',
  );
  await expect(page.getByRole('heading', { name: 'Market View interpretation' })).toBeVisible();
  await page.getByRole('link', { name: 'View evidence', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evidence & source' })).toBeVisible();
  await expect(page.getByText('Synthetic evidence only.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open official publication/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'Quarterly Archive', exact: true }).click();
  await expect(page.getByText('Quarter to date', { exact: true })).toBeVisible();
  await page.getByLabel('Archive cut').selectOption('demo-q1-reconstructed-v1');
  await expect(page.getByText('Reconstructed archive · revision 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Includes retrospective coverage', { exact: false })).toBeVisible();
  await page.getByLabel('Asset', { exact: true }).selectOption('em-equities');
  await page.getByRole('link', { name: 'Open Fable Grove Fictional Research EM equities' }).click();
  await expect(page.getByText(/Selected observation: demo-late-import-em-equities/)).toBeVisible();
  await expect(page.getByText('No source-level check recorded by this cut')).toBeVisible();
  expect(errors).toEqual([]);
  if (testInfo.project.name.startsWith('chromium'))
    await page.screenshot({
      path: `.local/screenshots/detail-${testInfo.project.use.viewport?.width}.png`,
      fullPage: true,
    });
  await page.getByRole('link', { name: '← Back to comparison', exact: true }).click();
  await expect(page.getByLabel('Archive cut')).toHaveValue('demo-q1-reconstructed-v1');
});
test('subdirectory direct links, reloads and four navigation views work without rewrites', async ({
  page,
  request,
}) => {
  const base = 'http://127.0.0.1:4174/market-view/';
  await page.goto(`${base}#/observations/demo-paper-q2-us-equities`);
  await expect(page.getByRole('heading', { name: 'Source statement' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'US equities', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Institutions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Institutions', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Methodology & Sources', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Comparison contract' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Time & revisions' })).toBeVisible();
  expect((await request.get(`${base}invented-server-route`)).status()).toBe(404);
});
test('keyboard access, empty filters and readable layout', async ({ page }, testInfo) => {
  await page.goto(root);
  await expect(page.getByRole('heading', { name: 'Latest Views', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByLabel('Asset', { exact: true }).selectOption('us-equities');
  const cell = page.getByRole('link', {
    name: 'Open Paper Moon Fictional Asset Management US equities',
    exact: true,
  });
  await cell.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Source statement' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('link', { name: 'Latest Views', exact: true }).click();
  await page.getByLabel('Asset', { exact: true }).selectOption('us-dollar');
  await page.getByLabel('Display status').selectOption('favorable');
  await expect(page.getByRole('heading', { name: 'No matching views' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  if (testInfo.project.name.startsWith('chromium'))
    await page.screenshot({
      path: `.local/screenshots/matrix-${testInfo.project.use.viewport?.width}.png`,
      fullPage: true,
    });
  if (testInfo.project.name.startsWith('chromium'))
    await page.screenshot({
      path: `.local/screenshots/viewport-${testInfo.project.use.viewport?.width}.png`,
    });
});
test('published build is honestly empty and deep links cannot activate demo', async ({
  page,
  request,
}) => {
  await page.goto('http://127.0.0.1:4175/?demo=true#/latest');
  await expect(page.getByRole('heading', { name: 'No approved views published' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.getByText('Paper Moon', { exact: false })).toHaveCount(0);
  await page.getByRole('link', { name: 'Quarterly Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No archived coverage' })).toBeVisible();
  await page.getByRole('link', { name: 'Institutions', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No approved institutions in coverage' }),
  ).toBeVisible();
  await page.goto('http://127.0.0.1:4175/#/observations/demo-paper-q2-us-equities');
  await expect(
    page.getByRole('heading', { name: 'Observation unavailable at this cut' }),
  ).toBeVisible();
  expect((await request.get('http://127.0.0.1:4175/data/demo/dataset.json')).status()).toBe(404);
  expect((await request.get('http://127.0.0.1:4175/data/drafts/private.json')).status()).toBe(404);
  await page.goto('http://127.0.0.1:4176/market-view/?demo=true#/latest');
  await expect(page.getByRole('heading', { name: 'No approved views published' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('note')).toHaveCount(0);
  expect(
    (await request.get('http://127.0.0.1:4176/market-view/data/demo/dataset.json')).status(),
  ).toBe(404);
});
