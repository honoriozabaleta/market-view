import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    plugins: [
      react(),
      {
        name: 'market-view-data-boundary',
        enforce: 'pre',
        resolveId(source) {
          if (
            /(?:^|[\\/])\.local(?:[\\/]|$)/.test(source) ||
            (!demo && /(?:data[\\/](?:demo|drafts)|data[\\/]candidates)/.test(source))
          ) {
            throw new Error(`Unpublished data import blocked: ${source}`);
          }
        },
        generateBundle() {
          for (const id of this.getModuleIds()) {
            if (
              /(?:^|[\\/])\.local[\\/]/.test(id) ||
              (!demo && /data[\\/](?:demo|drafts|candidates)[\\/]/.test(id))
            )
              throw new Error(`Unpublished module bundled: ${id}`);
          }
        },
      },
    ],
    base: process.env.BASE_PATH ?? '/',
    publicDir: false,
    resolve: {
      alias: {
        '@dataset': fileURLToPath(
          new URL(
            demo ? './data/demo/dataset.json' : './data/published/dataset.json',
            import.meta.url,
          ),
        ),
      },
    },
    define: { __DEMO__: JSON.stringify(demo) },
    build: { sourcemap: false, outDir: demo ? 'dist-demo' : 'dist' },
  };
});
