import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@drafts': fileURLToPath(new URL('./src/data/no-drafts.ts', import.meta.url)) },
  },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
