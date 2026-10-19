import { build } from 'vite';
await build({ mode: 'demo', base: '/', build: { outDir: '.local/browser/root' } });
await build({
  mode: 'demo',
  base: '/market-view/',
  build: { outDir: '.local/browser/subdirectory' },
});
await build({
  mode: 'production',
  base: '/market-view/',
  build: { outDir: '.local/browser/published-subdirectory' },
});
await import('./build');
