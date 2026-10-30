/**
 * Share images, drawn at build time from the edition data:
 *  - "og": 1200×630 link preview (LinkedIn, X, WhatsApp…)
 *  - "post": 1080×1350 portrait image with the full grid, for posting in a feed
 * Text is laid out by satori with the site's own fonts, then rasterised by resvg.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { CATEGORIES, SHORT_LABEL, scoreKey, type Score } from '../../src/domain/catalog.ts';
import type { Tone } from '../../src/domain/consensus.ts';
import type { EditionModel } from '../../src/domain/model.ts';
import { CARD_SIZE, type CardKind } from '../../src/domain/share.ts';

type Child = Node | string | null | false | undefined;
interface Node {
  type: 'div';
  props: { style: Record<string, unknown>; children?: Child[] };
}
const box = (style: Record<string, unknown>, ...children: Child[]): Node => ({
  type: 'div',
  props: {
    style: { display: 'flex', ...style },
    children: children.filter((c) => c !== null && c !== false && c !== undefined),
  },
});

const C = {
  night: '#0A0F1C',
  night2: '#111A2E',
  nightInk: '#EEF1F7',
  nightMuted: '#A3ADC2',
  mint: '#5BE3A8',
  paper: '#F6F4EF',
  surface: '#FFFFFF',
  ink: '#0D1424',
  ink2: '#38415A',
  muted: '#667085',
  rule: '#E6E2D9',
  none: '#EFECE5',
};
const STANCE: Record<string, { bg: string; fg: string }> = {
  ow2: { bg: '#0B7A5A', fg: '#FFFFFF' },
  ow1: { bg: '#47B38E', fg: C.ink },
  n: { bg: '#D9D3C5', fg: C.ink },
  uw1: { bg: '#EE8B78', fg: C.ink },
  uw2: { bg: '#C23E2B', fg: '#FFFFFF' },
  none: { bg: C.none, fg: C.muted },
};
const TONE: Record<Tone, { bg: string; fg: string }> = {
  ow: { bg: '#E2F3EB', fg: '#08664B' },
  lo: { bg: '#E2F3EB', fg: '#2F7D62' },
  n: { bg: '#EFECE5', fg: '#5B5446' },
  lu: { bg: '#FBE7E2', fg: '#A3412F' },
  uw: { bg: '#FBE7E2', fg: '#9A2E1E' },
  split: { bg: '#FFF1D6', fg: '#8A5300' },
  none: { bg: '#EFECE5', fg: C.muted },
};
const SHORT_ASSET: Record<string, string> = {
  'us-equities': 'US equities',
  'europe-equities': 'Europe equities',
  'japan-equities': 'Japan equities',
  'em-equities': 'EM equities',
  'us-treasuries': 'US Treasuries',
  'ig-credit': 'IG credit',
  'hy-credit': 'High yield',
  'em-debt': 'EM debt',
  gold: 'Gold',
  commodities: 'Commodities',
  'us-dollar': 'US dollar',
  cash: 'Cash',
};

const stanceOf = (s: Score | null) =>
  s === null ? 'none' : s >= 2 ? 'ow2' : s === 1 ? 'ow1' : s === 0 ? 'n' : s === -1 ? 'uw1' : 'uw2';
const label = (s: Score | null) => (s === null ? '—' : SHORT_LABEL[scoreKey(s)].replace('−', '-'));
const dateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

function logo(size: number) {
  const bar = (h: number, color: string) =>
    box({ width: size * 0.15, height: size * h, borderRadius: 2, backgroundColor: color });
  return box(
    {
      width: size,
      height: size,
      borderRadius: size * 0.28,
      backgroundColor: '#FFFFFF',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: size * 0.07,
      paddingBottom: size * 0.2,
    },
    bar(0.26, '#C23E2B'),
    bar(0.4, '#B4AC9B'),
    bar(0.58, '#0B7A5A'),
  );
}

function headlines(m: EditionModel) {
  const s = m.strongest;
  const sp = m.split;
  return {
    strong: s ? `${s.stats.mode === 'uw' ? 'Underweight' : 'Overweight'} ${s.asset.name}` : null,
    strongMeta: s ? `${s.stats.counts[s.stats.mode!]} of ${s.stats.n} houses` : null,
    split: sp ? sp.asset.name : null,
  };
}

function ogCard(m: EditionModel, siteUrl: string): Node {
  const hl = headlines(m);
  const mono = (color: string, text: string) =>
    box(
      { width: 54, height: 30, alignItems: 'center', justifyContent: 'center' },
      box(
        {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color,
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 700,
          alignItems: 'center',
          justifyContent: 'center',
        },
        text,
      ),
    );
  const grid = box(
    {
      flexDirection: 'column',
      gap: 6,
      padding: 24,
      width: 444,
      borderRadius: 24,
      backgroundColor: C.night2,
      border: '1px solid rgba(255,255,255,0.12)',
    },
    box(
      { alignItems: 'center' },
      box({ width: 160 }, ''),
      ...m.houses.map((h) => mono(h.house.color, h.house.mono)),
    ),
    ...m.assets.map((a) =>
      box(
        { alignItems: 'center' },
        box({ width: 160, fontSize: 15, color: C.nightMuted }, SHORT_ASSET[a.asset.id]),
        ...a.cells.map((c) => {
          const st = STANCE[stanceOf(c.call.score)];
          return box(
            { width: 54, height: 26, alignItems: 'center', justifyContent: 'center' },
            box(
              {
                width: 48,
                height: 24,
                borderRadius: 6,
                backgroundColor: st.bg,
                color: st.fg,
                fontSize: 11,
                fontWeight: 700,
                alignItems: 'center',
                justifyContent: 'center',
              },
              label(c.call.score),
            ),
          );
        }),
      ),
    ),
  );
  const stat = (dot: string, title: string, value: string | null, meta: string | null) =>
    value
      ? box(
          { alignItems: 'center', gap: 14 },
          box({ width: 12, height: 12, borderRadius: 6, backgroundColor: dot }),
          box(
            { flexDirection: 'column' },
            box(
              { fontSize: 15, color: C.nightMuted, fontWeight: 600, letterSpacing: 1.5 },
              title.toUpperCase(),
            ),
            box(
              { fontFamily: 'Bricolage', fontSize: 24, fontWeight: 700 },
              meta ? `${value} · ${meta}` : value,
            ),
          ),
        )
      : null;
  return box(
    {
      // satori sizes are content-box: 1200×630 minus padding
      width: 1088,
      height: 534,
      padding: '48px 56px',
      gap: 56,
      backgroundColor: C.night,
      backgroundImage:
        'radial-gradient(circle at 88% 0%, rgba(51,85,255,0.38), rgba(10,15,28,0) 60%)',
      color: C.nightInk,
      fontFamily: 'Inter',
    },
    box(
      { flexDirection: 'column', justifyContent: 'space-between', width: 540, flexShrink: 0 },
      box(
        { alignItems: 'center', gap: 14 },
        logo(40),
        box({ fontFamily: 'Bricolage', fontSize: 30, fontWeight: 700 }, 'Market View'),
      ),
      box(
        { flexDirection: 'column', gap: 14 },
        box(
          { fontSize: 16, fontWeight: 600, letterSpacing: 2, color: C.mint },
          `${m.edition.label.toUpperCase()} EDITION · CUT-OFF ${dateLabel(m.edition.cutoff).toUpperCase()}`,
        ),
        box(
          {
            flexDirection: 'column',
            fontFamily: 'Bricolage',
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -1.4,
          },
          box({}, "How the world's"),
          box({}, 'biggest banks see'),
          box({}, 'the markets,'),
          box({ color: C.mint }, 'reconciled.'),
        ),
      ),
      box(
        { flexDirection: 'column', gap: 16 },
        stat('#47B38E', 'Strongest consensus', hl.strong, hl.strongMeta),
        stat('#FFC457', 'Biggest split', hl.split, null),
      ),
      box({ fontSize: 17, fontWeight: 600, color: C.nightInk }, host(siteUrl)),
    ),
    box({ flexDirection: 'column', justifyContent: 'center', width: 492, flexShrink: 0 }, grid),
  );
}

function postCard(m: EditionModel, siteUrl: string): Node {
  const hl = headlines(m);
  const NAME = 236;
  const CELL = 100;
  const header = box(
    { alignItems: 'flex-end', paddingBottom: 10, borderBottom: `1px solid ${C.rule}` },
    box(
      { width: NAME, fontSize: 14, color: C.muted, fontWeight: 600, letterSpacing: 1.5 },
      'ASSET',
    ),
    ...m.houses.map((h) =>
      box(
        { width: CELL, flexDirection: 'column', alignItems: 'center', gap: 6 },
        box(
          {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: h.house.color,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            alignItems: 'center',
            justifyContent: 'center',
          },
          h.house.mono,
        ),
        box(
          { fontSize: 13, fontWeight: 600, color: C.ink2 },
          h.house.name.replace('Goldman Sachs', 'Goldman').replace('Morgan Stanley', 'M. Stanley'),
        ),
      ),
    ),
    box(
      {
        flexGrow: 1,
        justifyContent: 'flex-end',
        fontSize: 14,
        color: C.muted,
        fontWeight: 600,
        letterSpacing: 1.5,
      },
      'CONSENSUS',
    ),
  );
  const rows: Node[] = [];
  for (const cat of CATEGORIES) {
    rows.push(
      box(
        {
          paddingTop: 14,
          paddingBottom: 4,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 2,
          color: C.muted,
        },
        cat.name.toUpperCase(),
      ),
    );
    for (const a of m.assets.filter((x) => x.asset.category === cat.id)) {
      const tone = TONE[a.stats.verdict.tone];
      rows.push(
        box(
          { alignItems: 'center', height: 50 },
          box({ width: NAME, fontSize: 19, fontWeight: 600, color: C.ink }, a.asset.name),
          ...a.cells.map((c) => {
            const st = STANCE[stanceOf(c.call.score)];
            return box(
              { width: CELL, justifyContent: 'center' },
              box(
                {
                  width: 88,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: st.bg,
                  color: st.fg,
                  fontSize: 16,
                  fontWeight: 700,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                label(c.call.score),
              ),
            );
          }),
          box(
            { flexGrow: 1, justifyContent: 'flex-end' },
            box(
              {
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: 999,
                backgroundColor: tone.bg,
                color: tone.fg,
                fontSize: 14,
                fontWeight: 700,
              },
              a.stats.verdict.label,
            ),
          ),
        ),
      );
    }
  }
  const swatch = (key: string, text: string) =>
    box(
      { alignItems: 'center', gap: 8, fontSize: 15, color: C.ink2 },
      box({ width: 18, height: 18, borderRadius: 5, backgroundColor: STANCE[key].bg }),
      text,
    );
  return box(
    {
      width: 1080,
      height: 1350,
      flexDirection: 'column',
      backgroundColor: C.paper,
      fontFamily: 'Inter',
      color: C.ink,
    },
    box(
      {
        flexDirection: 'column',
        gap: 18,
        padding: '48px 64px 44px',
        backgroundColor: C.night,
        backgroundImage:
          'radial-gradient(circle at 90% 0%, rgba(51,85,255,0.4), rgba(10,15,28,0) 60%)',
        color: C.nightInk,
      },
      box(
        { alignItems: 'center', justifyContent: 'space-between' },
        box(
          { alignItems: 'center', gap: 14 },
          logo(38),
          box({ fontFamily: 'Bricolage', fontSize: 28, fontWeight: 700 }, 'Market View'),
        ),
        box(
          { fontSize: 16, fontWeight: 600, letterSpacing: 2, color: C.mint },
          `${m.edition.label.toUpperCase()} EDITION`,
        ),
      ),
      box(
        {
          flexDirection: 'column',
          fontFamily: 'Bricolage',
          fontSize: 50,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: -1.2,
        },
        box({}, "How the world's biggest banks"),
        box({}, 'see the markets, reconciled.'),
      ),
      box(
        { fontSize: 20, color: C.nightMuted },
        `${m.houses.length} global houses · ${m.assets.length} asset classes · one common scale · cut-off ${dateLabel(m.edition.cutoff)}`,
      ),
    ),
    box({ flexDirection: 'column', padding: '28px 64px 0' }, header, ...rows),
    box(
      { flexDirection: 'column', gap: 18, padding: '22px 64px 40px', marginTop: 'auto' },
      box(
        { gap: 28, fontSize: 18, color: C.ink },
        hl.strong
          ? box(
              { gap: 8 },
              box({ fontWeight: 700 }, 'Strongest consensus:'),
              `${hl.strong} (${hl.strongMeta})`,
            )
          : null,
        hl.split ? box({ gap: 8 }, box({ fontWeight: 700 }, 'Biggest split:'), hl.split) : null,
      ),
      box(
        { gap: 22, flexWrap: 'wrap' },
        swatch('uw1', 'Underweight'),
        swatch('n', 'Neutral'),
        swatch('ow1', 'Overweight'),
        swatch('ow2', 'Strong overweight'),
        swatch('none', 'No view published'),
      ),
      box(
        {
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: `1px solid ${C.rule}`,
          fontSize: 14,
          color: C.muted,
        },
        box(
          {},
          'Independent research · not investment advice · sources and dates for every call on the site',
        ),
        box({ fontWeight: 700, color: C.ink }, host(siteUrl)),
      ),
    ),
  );
}

let fontCache:
  { name: string; data: Buffer; weight: 400 | 600 | 700 | 800; style: 'normal' }[] | null = null;
function fonts() {
  if (fontCache) return fontCache;
  const require = createRequire(import.meta.url);
  const dir = (pkg: string) => join(dirname(require.resolve(`${pkg}/package.json`)), 'files');
  const inter = dir('@fontsource/inter');
  const brico = dir('@fontsource/bricolage-grotesque');
  fontCache = [
    {
      name: 'Inter',
      data: readFileSync(join(inter, 'inter-latin-400-normal.woff')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: readFileSync(join(inter, 'inter-latin-600-normal.woff')),
      weight: 600,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: readFileSync(join(inter, 'inter-latin-700-normal.woff')),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Bricolage',
      data: readFileSync(join(brico, 'bricolage-grotesque-latin-700-normal.woff')),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Bricolage',
      data: readFileSync(join(brico, 'bricolage-grotesque-latin-800-normal.woff')),
      weight: 800,
      style: 'normal',
    },
  ];
  return fontCache;
}

export { cardFileName } from '../../src/domain/share.ts';

export async function renderCard(
  kind: CardKind,
  model: EditionModel,
  siteUrl: string,
): Promise<Buffer> {
  const [width, height] = CARD_SIZE[kind];
  const tree = kind === 'og' ? ogCard(model, siteUrl) : postCard(model, siteUrl);
  // satori accepts React-element-like objects; our tree is plain data.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: fonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}
