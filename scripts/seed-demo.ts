/** Explicit fixture authoring utility. Never imported by the application or production build. */
import { mkdir, writeFile, access } from 'node:fs/promises';
import {
  DatasetSchema,
  type Dataset,
  type Observation,
  type Publication,
  type AssetId,
} from '../src/domain/schema';
import { assets } from '../src/domain/catalog';
const target = 'data/demo/dataset.json';
try {
  await access(target);
  throw new Error('Refusing to overwrite versioned demo fixtures');
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
const data: Dataset = {
  schemaVersion: '1',
  methodologyVersion: '1.0.0',
  mode: 'demo',
  asOf: '2026-05-20T23:59:59Z',
  institutions: [],
  sources: [],
  streams: [],
  publications: [],
  mappings: [],
  observations: [],
  reviews: [],
  snapshots: [],
};
const teams = [
  ['paper-moon', 'Paper Moon Fictional Asset Management', 'asset_manager'],
  ['imaginary-harbor', 'Imaginary Harbor Demo Bank', 'bank'],
  ['fable-grove', 'Fable Grove Fictional Research', 'research_firm'],
] as const;
for (const [id, name, kind] of teams) {
  data.institutions.push({ id, name, kind, isFictional: true });
  data.sources.push({
    id: `${id}-source`,
    officialUrl: null,
    verifiedAt: '2026-05-20T12:00:00Z',
    usage: { status: 'demo', scope: 'Synthetic fixture only', reviewer: null, reviewedAt: null },
  });
  data.streams.push({
    id: `${id}-stream`,
    institutionId: id,
    sourceId: `${id}-source`,
    division: 'Fictional Multi-Asset Division',
    team: 'Demo Allocation Team',
    series: 'Synthetic Allocation Notes',
    expectedCadenceDays: null,
    staleAfterDays: 100,
    stalenessBasis: 'Demo assumption: 100 days; cadence not verified',
    defaultForInstitution: true,
  });
}
function publication(
  id: string,
  team: string,
  date: string | null,
  observed?: string,
): Publication {
  const firstObservedAt = observed ?? `${date}T09:00:00Z`;
  const p: Publication = {
    id,
    streamId: `${team}-stream`,
    title: `${id} — synthetic research fixture`,
    officialUrl: null,
    publishedDate: date,
    datePrecision: date ? 'day' : 'unknown',
    firstObservedAt,
    version: 'fixture-v1',
    fingerprint: null,
    supersedesPublicationId: null,
    editorialState: 'demo',
    marketViewPublishedAt: firstObservedAt.replace('09:00:00', '12:00:00'),
  };
  data.publications.push(p);
  return p;
}
const p1 = publication('demo-paper-q1', 'paper-moon', '2026-02-10');
const p2 = publication('demo-paper-q2', 'paper-moon', '2026-04-15');
const h1 = publication('demo-harbor-q1', 'imaginary-harbor', '2026-01-05');
const h2 = publication('demo-harbor-q2', 'imaginary-harbor', '2026-05-05');
const f1 = publication('demo-grove-q1', 'fable-grove', '2026-03-02');
const f2 = publication('demo-grove-q2', 'fable-grove', '2026-04-20');
const undated = publication('demo-undated', 'paper-moon', null, '2026-05-18T09:00:00Z');
const late = publication('demo-late-import', 'fable-grove', '2026-03-25', '2026-05-10T09:00:00Z');
function add(
  p: Publication,
  assetId: AssetId,
  stance: 'Overweight' | 'Neutral' | 'Underweight' | null,
  overrides: Partial<Observation> = {},
) {
  const asset = assets.find((a) => a.id === assetId)!;
  const id = `${p.id}-${assetId}`;
  const evidence = {
    citation: `${p.title}, ${p.version}. Authored test data; no external publication exists.`,
    locator: `Synthetic allocation table / ${asset.label} row`,
  };
  const normalized =
    stance === 'Overweight'
      ? 'favorable'
      : stance === 'Neutral'
        ? 'neutral'
        : stance === 'Underweight'
          ? 'unfavorable'
          : null;
  const o: Observation = {
    id,
    publicationId: p.id,
    assetId,
    originalAsset: asset.label,
    originalUniverse: `${asset.geography} ${asset.scope}`,
    universe: { scope: asset.scope, geography: asset.geography, currency: asset.currency },
    viewType: 'allocation',
    originalStance: stance,
    normalizedStance: normalized,
    mappingRuleId: null,
    horizon: { original: 'Next 12 months', months: 12 },
    benchmark: 'Strategic allocation',
    currency: 'USD',
    forecast: null,
    thesis: {
      text: 'Synthetic thesis: improving earnings and a balanced risk budget support this example allocation.',
      evidence,
    },
    risks: [
      {
        text: 'Synthetic risk: an adverse growth or inflation surprise could invalidate the example.',
        evidence,
      },
    ],
    editorialInterpretation: null,
    evidence,
    verifiedAt: p.firstObservedAt.replace('09:00:00', '10:00:00'),
    firstPublishedAt: p.marketViewPublishedAt,
    status: 'active',
    revisionKind: 'initial',
    replacesObservationId: null,
    ...overrides,
  };
  if (o.normalizedStance) {
    const mappingId = `${o.id}-mapping`;
    data.mappings.push({
      id: mappingId,
      streamId: p.streamId,
      viewType: 'allocation',
      originalLabel: o.originalStance!,
      normalized: o.normalizedStance,
      universe: o.universe,
      benchmark: o.benchmark!,
      horizonMonths: o.horizon.months!,
      rationale:
        'Fixture-specific explicit allocation labels relative to Strategic allocation. No rule for real institutions.',
    });
    o.mappingRuleId = mappingId;
  }
  data.observations.push(o);
  data.reviews.push({
    id: `${o.id}-review`,
    observationId: o.id,
    status: 'demo',
    reviewer: null,
    at: o.verifiedAt.replace('10:00:00', '11:00:00'),
    rationale: 'Simulated lifecycle for automated tests. No human review claimed.',
  });
  return o;
}
const paperUS = add(p1, 'us-equities', 'Neutral');
add(p2, 'us-equities', 'Overweight', {
  revisionKind: 'view_update',
  replacesObservationId: paperUS.id,
});
add(p1, 'gold', 'Overweight'); // Partial Q2 update does not renew gold.
add(p2, 'us-treasuries', 'Neutral');
add(p2, 'ig-credit', null, {
  viewType: 'directional',
  originalStance: 'Bullish',
  normalizedStance: null,
});
add(p2, 'european-equities', 'Underweight');
add(p2, 'hy-credit', null, {
  horizon: { original: null, months: null },
  originalStance: 'Attractive',
  normalizedStance: null,
});
add(undated, 'us-equities', 'Underweight');
add(h1, 'gold', 'Neutral'); // stale, even after a recent verification below.
data.observations.at(-1)!.verifiedAt = '2026-05-12T10:00:00Z';
data.observations.at(-1)!.firstPublishedAt = '2026-05-12T12:00:00Z';
data.reviews.at(-1)!.at = '2026-05-12T11:00:00Z';
add(h1, 'em-equities', 'Overweight');
add(h2, 'us-equities', 'Neutral', { horizon: { original: 'Next 3 months', months: 3 } });
const hCredit = add(h2, 'ig-credit', 'Overweight', {
  originalUniverse: 'Global investment-grade credit, USD hedged',
  universe: { scope: 'investment-grade', geography: 'Global', currency: 'USD' },
});
const hT = add(h2, 'us-treasuries', 'Overweight');
add(h2, 'us-treasuries', 'Neutral', {
  id: 'demo-harbor-treasuries-correction',
  revisionKind: 'extraction_correction',
  replacesObservationId: hT.id,
  verifiedAt: '2026-05-08T10:00:00Z',
  firstPublishedAt: '2026-05-08T12:00:00Z',
  thesis: {
    text: 'Synthetic extraction correction: the source row says Neutral; an earlier entry read the adjacent row.',
    evidence: hT.evidence,
  },
});
add(h2, 'european-equities', 'Neutral');
add(h2, 'us-dollar', null, {
  viewType: 'quantitative',
  originalStance: null,
  normalizedStance: null,
  forecast: { value: 102, unit: 'Synthetic trade-weighted index points' },
});
const fUS = add(f1, 'us-equities', 'Underweight');
add(f2, 'us-equities', 'Neutral', { revisionKind: 'view_update', replacesObservationId: fUS.id });
add(f2, 'european-equities', 'Overweight');
add(f2, 'us-treasuries', 'Underweight');
add(f2, 'ig-credit', 'Neutral');
add(f2, 'hy-credit', null, { viewType: 'narrative', originalStance: null });
const gold = add(f1, 'gold', 'Neutral');
add(f2, 'gold', null, {
  status: 'withdrawn',
  revisionKind: 'withdrawal',
  replacesObservationId: gold.id,
  normalizedStance: null,
});
const lateEM = add(late, 'em-equities', 'Neutral');
void hCredit;
const entry = (o: Observation) => ({
  observationId: o.id,
  publicationId: o.publicationId,
  publicationVersion: 'fixture-v1',
});
const original = data.observations.filter(
  (o) =>
    [p1.id, f1.id, h1.id].includes(o.publicationId) &&
    o.firstPublishedAt! <= '2026-03-31T23:59:59Z',
);
data.snapshots.push({
  id: 'demo-q1-recorded-v1',
  cutoff: '2026-03-31T23:59:59Z',
  createdAt: '2026-03-31T23:59:59Z',
  methodologyVersion: '1.0.0',
  nature: 'recorded',
  revision: 1,
  supersedesSnapshotId: null,
  entries: original.map(entry),
});
data.snapshots.push({
  id: 'demo-q1-reconstructed-v1',
  cutoff: '2026-03-31T23:59:59Z',
  createdAt: '2026-05-15T12:00:00Z',
  methodologyVersion: '1.0.0',
  nature: 'reconstructed',
  revision: 1,
  supersedesSnapshotId: null,
  entries: [...original, lateEM].map(entry),
});
const parsed = DatasetSchema.parse(data);
await mkdir('data/demo', { recursive: true });
await writeFile(target, JSON.stringify(parsed, null, 2) + '\n');
console.log(`Created ${target}: ${data.observations.length} synthetic observations`);
