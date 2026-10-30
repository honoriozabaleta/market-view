/**
 * Vite plugin: emits the share images for every edition, adds Open Graph / Twitter tags for the
 * latest one, and serves the images on demand in the dev server.
 */
import type { Plugin } from 'vite';
import { cardFileName, type CardKind } from '../../src/domain/share.ts';
import { renderCard } from './cards.ts';
import { loadEditionDirs, modelsFor } from './editions-node.ts';

export function shareCards({ siteUrl, drafts }: { siteUrl: string; drafts: boolean }): Plugin {
  const models = () =>
    modelsFor(loadEditionDirs(['data/editions', ...(drafts ? ['data/drafts'] : [])]));
  const site = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;

  return {
    name: 'market-view-share-cards',

    transformIndexHtml() {
      const all = models();
      const m = all[all.length - 1];
      if (!m) return;
      const title = `Market View · ${m.edition.label}: how the world's biggest banks see the markets`;
      const parts = [
        m.strongest &&
          `Strongest consensus: ${m.strongest.stats.mode === 'uw' ? 'underweight' : 'overweight'} ${m.strongest.asset.name} (${m.strongest.stats.counts[m.strongest.stats.mode!]} of ${m.strongest.stats.n} houses).`,
        m.split && `Biggest split: ${m.split.asset.name}.`,
        `${m.houses.length} global houses, ${m.assets.length} asset classes, one common scale.`,
      ].filter(Boolean);
      const description = parts.join(' ');
      const image = new URL(cardFileName(m.edition.id, 'og'), site).href;
      const meta = (attrs: Record<string, string>) => ({
        tag: 'meta',
        attrs,
        injectTo: 'head' as const,
      });
      return [
        meta({ property: 'og:type', content: 'website' }),
        meta({ property: 'og:site_name', content: 'Market View' }),
        meta({ property: 'og:title', content: title }),
        meta({ property: 'og:description', content: description }),
        meta({ property: 'og:url', content: site }),
        meta({ property: 'og:image', content: image }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({
          property: 'og:image:alt',
          content: `Market View ${m.edition.label} consensus grid`,
        }),
        meta({ name: 'twitter:card', content: 'summary_large_image' }),
        meta({ name: 'twitter:title', content: title }),
        meta({ name: 'twitter:description', content: description }),
        meta({ name: 'twitter:image', content: image }),
      ];
    },

    async generateBundle() {
      for (const m of models())
        for (const kind of ['og', 'post'] as const)
          this.emitFile({
            type: 'asset',
            fileName: cardFileName(m.edition.id, kind),
            source: await renderCard(kind, m, site),
          });
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/share\/market-view-(\d{4}-q[1-4])(-post)?\.png/);
        if (!match) return next();
        const m = models().find((x) => x.edition.id === match[1]);
        if (!m) return next();
        const kind: CardKind = match[2] ? 'post' : 'og';
        res.setHeader('Content-Type', 'image/png');
        res.end(await renderCard(kind, m, site));
      });
    },
  };
}
