import { z } from 'zod';
import { ASSET_IDS, HOUSE_IDS } from './catalog.ts';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const httpsUrl = z.url().refine((u) => u.startsWith('https://'), 'URL must use HTTPS');
const houseId = z.enum(HOUSE_IDS);

export const scoreSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const callSchema = z
  .object({
    asset: z.enum(ASSET_IDS),
    /** Position on the common scale; null when the source states no explicit view. */
    score: scoreSchema.nullable(),
    /** The house's original wording, e.g. "Attractive" or "Equal weight". */
    label: z.string().min(1).nullable(),
    /** One line in our own words: why the house holds this view (or why there is none). */
    thesis: z.string().min(1),
    /** Where in the publication the view is stated. */
    locator: z.string().optional(),
    /** The house's own category when it is broader or narrower than ours, e.g. "International equities (developed markets)". */
    basis: z.string().min(1).optional(),
    confidence: z.enum(['high', 'medium', 'low']).optional(),
  })
  .refine((c) => (c.score === null) === (c.label === null), {
    message: 'score and label must both be set, or both be null',
  });

const scaleSchema = z.object({
  '2': z.string().nullable().optional(),
  '1': z.string().nullable().optional(),
  '0': z.string().nullable().optional(),
  '-1': z.string().nullable().optional(),
  '-2': z.string().nullable().optional(),
});

export const houseEditionSchema = z
  .object({
    house: houseId,
    source: z.object({ title: z.string().min(1), url: httpsUrl, published: isoDate }),
    scaleObserved: scaleSchema.optional(),
    worldview: z.string().min(1),
    keyRisk: z.string().min(1),
    calls: z.array(callSchema),
  })
  .superRefine((h, ctx) => {
    const seen = new Set<string>();
    for (const c of h.calls) {
      if (seen.has(c.asset))
        ctx.addIssue({ code: 'custom', message: `Duplicate call for ${c.asset}` });
      seen.add(c.asset);
    }
    for (const a of ASSET_IDS) {
      if (!seen.has(a))
        ctx.addIssue({
          code: 'custom',
          message: `Missing call for ${a} (use score: null when there is no view)`,
        });
    }
  });

const forecastValueSchema = z.object({
  value: z.number(),
  period: z.string().optional(),
  source: httpsUrl.optional(),
  published: isoDate.optional(),
  producer: z.string().optional(),
});

export const forecastSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sub: z.string().min(1),
  kind: z.enum(['level', 'rate', 'growth']),
  decimals: z.number().int().min(0).max(4),
  unit: z.string().nullable().optional(),
  spot: z.number().nullable(),
  spotAsOf: isoDate.nullable().optional(),
  spotSource: httpsUrl.nullable().optional(),
  values: z.partialRecord(houseId, forecastValueSchema.nullable()),
});

export const themeSchema = z.object({
  name: z.string().min(1),
  houses: z.array(houseId).min(1),
});

export const editionSchema = z
  .object({
    id: z.string().regex(/^\d{4}-q[1-4]$/, 'Use YYYY-qN, e.g. 2026-q4'),
    label: z.string().min(1),
    cutoff: isoDate,
    /** illustrative = invented sample data; draft = real but not yet reviewed; published = reviewed by the owner. */
    status: z.enum(['illustrative', 'draft', 'published']),
    note: z.object({ title: z.string().min(1), body: z.string().min(1) }).optional(),
    houses: z.array(houseEditionSchema).min(1),
    forecasts: z.array(forecastSchema).default([]),
    themes: z.array(themeSchema).default([]),
  })
  .superRefine((e, ctx) => {
    const seen = new Set<string>();
    for (const h of e.houses) {
      if (seen.has(h.house))
        ctx.addIssue({ code: 'custom', message: `House ${h.house} appears twice` });
      seen.add(h.house);
      if (h.source.published > e.cutoff)
        ctx.addIssue({
          code: 'custom',
          message: `${h.house}: source published after the edition cut-off`,
        });
    }
  });

export type Call = z.infer<typeof callSchema>;
export type HouseEdition = z.infer<typeof houseEditionSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Edition = z.infer<typeof editionSchema>;
export type EditionStatus = Edition['status'];
