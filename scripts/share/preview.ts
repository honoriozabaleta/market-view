/** Writes the share images for every published edition to .local/share/ for a quick look. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { cardFileName, renderCard } from './cards.ts';
import { loadEditionDirs, modelsFor } from './editions-node.ts';

const dirs = process.argv.includes('--examples') ? ['data/examples'] : ['data/editions'];
const site = process.env.SITE_URL ?? 'https://honoriozabaleta.github.io/market-view/';
mkdirSync('.local/share', { recursive: true });
for (const m of modelsFor(loadEditionDirs(dirs))) {
  for (const kind of ['og', 'post'] as const) {
    const out = join('.local/share', basename(cardFileName(m.edition.id, kind)));
    writeFileSync(out, await renderCard(kind, m, site));
    console.log('wrote', out);
  }
}
