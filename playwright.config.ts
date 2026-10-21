import { defineConfig } from '@playwright/test';

/**
 * Serves the production build and runs the main stories at phone, tablet and desktop widths.
 * Phone and tablet run with reduced motion (also covering that accessibility path); desktop runs
 * every animation. Locally you can reuse an installed browser: PW_CHANNEL=msedge npm run test:browser
 */
const channel = process.env.PW_CHANNEL;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [390, 820, 1440].map((width) => ({
    name: `chromium-${width}`,
    use: {
      browserName: 'chromium',
      channel,
      viewport: { width, height: 900 },
      hasTouch: width === 390,
      reducedMotion: width === 1440 ? 'no-preference' : 'reduce',
    },
  })),
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
