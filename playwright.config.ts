import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: ['chromium', 'webkit'].flatMap((browserName) =>
    [390, 820, 1440].map((width) => ({
      name: `${browserName}-${width}`,
      use: {
        browserName: browserName as 'chromium' | 'webkit',
        viewport: { width, height: 1000 },
        hasTouch: width === 390,
      },
    })),
  ),
  webServer: [
    {
      command:
        'npx tsx scripts/serve-static.ts .local/browser/published-subdirectory /market-view/ 4176',
      url: 'http://127.0.0.1:4176/market-view/',
      reuseExistingServer: false,
    },
    {
      command: 'npx tsx scripts/serve-static.ts .local/browser/root / 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
    },
    {
      command: 'npx tsx scripts/serve-static.ts .local/browser/subdirectory /market-view/ 4174',
      url: 'http://127.0.0.1:4174/market-view/',
      reuseExistingServer: false,
    },
    {
      command: 'npx tsx scripts/serve-static.ts dist / 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
    },
  ],
});
