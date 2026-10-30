import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import pkg from './package.json' with { type: 'json' };
import { shareCards } from './scripts/share/plugin.ts';

/** Private material (drafts, local captures, the archived foundation) must never reach a public build. */
const PRIVATE = /(?:^|[\\/])(?:\.local|archive)[\\/]|data[\\/]drafts[\\/]/;
const DRAFTS = /data[\\/]drafts[\\/]/;

function privateBoundary(allowDrafts: boolean): Plugin {
  const blocked = (id: string) => PRIVATE.test(id) && !(allowDrafts && DRAFTS.test(id));
  return {
    name: 'market-view-private-boundary',
    generateBundle() {
      for (const id of this.getModuleIds())
        if (blocked(id)) throw new Error(`Private module bundled: ${id}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const drafts = mode === 'drafts';
  return {
    plugins: [
      react(),
      privateBoundary(drafts),
      // Share images and link-preview tags; SITE_URL is set by the Pages workflow.
      shareCards({ siteUrl: process.env.SITE_URL ?? pkg.homepage, drafts }),
    ],
    base: process.env.BASE_PATH ?? '/',
    publicDir: false,
    resolve: {
      alias: {
        '@drafts': fileURLToPath(
          new URL(drafts ? './src/data/drafts.ts' : './src/data/no-drafts.ts', import.meta.url),
        ),
      },
    },
    // React, motion and the globe outline make one ~190 kB gzip bundle; fine for a single page.
    build: {
      sourcemap: false,
      outDir: drafts ? 'dist-drafts' : 'dist',
      chunkSizeWarningLimit: 700,
    },
  };
});
