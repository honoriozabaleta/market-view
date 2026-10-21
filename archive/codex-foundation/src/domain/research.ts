import { z } from 'zod';
import {
  AssetIdSchema,
  ClaimSchema,
  DatasetSchema,
  EvidenceSchema,
  InstantSchema,
  InstitutionSchema,
  ObservationSchema,
  OfficialUrlSchema,
  PublicationSchema,
  ReviewSchema,
  compareInstants,
} from './schema';
import { assetIds } from './schema';

const Text = z.string().trim().min(1);
const Id = Text.regex(/^[a-z0-9][a-z0-9-]*$/);
const Pending = z.strictObject({ status: z.literal('pending'), reviewer: z.null(), at: z.null() });
const CaptureKind = z.enum(['dated_document', 'mutable_page', 'search_metadata']);
const ForecastCommon = {
  indicator: Text,
  unit: Text,
  targetPeriod: Text.nullable(),
  basis: Text.nullable(),
  sourceAsOf: z.iso.date().nullable(),
};
export const MacroForecastSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('point'), ...ForecastCommon, value: z.number().finite() }),
  z
    .strictObject({
      kind: z.literal('range'),
      ...ForecastCommon,
      low: z.number().finite(),
      high: z.number().finite(),
    })
    .refine((x) => x.low <= x.high, 'Range lower bound exceeds upper bound'),
]);
export const MacroObservationSchema = z.strictObject({
  id: Id,
  publicationId: Id,
  topic: z.enum([
    'growth',
    'inflation',
    'monetary-policy',
    'fiscal-policy',
    'employment',
    'scenario',
    'catalyst',
    'other',
  ]),
  geography: Text.nullable(),
  scenario: z.strictObject({
    originalLabel: Text.nullable(),
    kind: z.enum(['central', 'upside', 'downside', 'unspecified']),
    probabilityPercent: z.number().min(0).max(100).nullable(),
  }),
  claim: ClaimSchema,
  forecast: MacroForecastSchema.nullable(),
  risks: z.array(ClaimSchema),
  catalysts: z.array(ClaimSchema),
  review: Pending,
});
export const ResearchPackageSchema = z
  .strictObject({
    schemaVersion: z.literal('research-package-1'),
    publication: PublicationSchema,
    provenance: z.strictObject({
      sourceUrl: OfficialUrlSchema,
      capturedAt: InstantSchema,
      verifiedAt: InstantSchema,
      captureKind: CaptureKind,
      fingerprint: Text.nullable(),
      versionNote: Text,
    }),
    assets: z.array(ObservationSchema),
    reviews: z.array(ReviewSchema),
    assetContexts: z.array(
      z.strictObject({
        observationId: Id,
        sourceAsOf: z.iso.date().nullable(),
        sourceAsOfOriginal: Text.nullable(),
        horizon: z.strictObject({
          original: Text.nullable(),
          minMonths: z.number().positive().nullable(),
          maxMonths: z.number().positive().nullable(),
        }),
      }),
    ),
    assetAudit: z.array(
      z.strictObject({
        assetId: AssetIdSchema,
        status: z.enum(['extracted', 'not_discussed', 'ambiguous', 'not_accessible']),
        note: Text,
      }),
    ),
    macro: z.array(MacroObservationSchema),
    issues: z.array(
      z.strictObject({
        id: Id,
        targetId: Id.nullable(),
        kind: z.enum([
          'metadata',
          'extraction',
          'comparability',
          'usage',
          'history',
          'source_access',
        ]),
        question: Text,
        evidence: EvidenceSchema.nullable(),
      }),
    ),
    review: Pending,
    // Optional bridge only when an actual legacy draft can be represented without invented policy.
    legacyDraft: DatasetSchema.nullable(),
  })
  .superRefine((p, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (p.publication.editorialState !== 'draft' || p.publication.marketViewPublishedAt !== null)
      issue(['publication'], 'Research packages must remain private drafts without release times');
    if (!p.publication.officialUrl || p.publication.officialUrl !== p.provenance.sourceUrl)
      issue(['provenance', 'sourceUrl'], 'Capture URL must identify this publication');
    if (p.provenance.captureKind === 'search_metadata')
      issue(['provenance'], 'Search metadata alone cannot support an extraction');
    if (
      compareInstants(p.publication.firstObservedAt, p.provenance.capturedAt) > 0 ||
      compareInstants(p.provenance.capturedAt, p.provenance.verifiedAt) > 0
    )
      issue(
        ['provenance'],
        'Observation must precede capture, and capture must precede verification',
      );
    if (p.publication.fingerprint !== p.provenance.fingerprint)
      issue(['provenance', 'fingerprint'], 'Fingerprints disagree');
    if (
      p.publication.publishedDate === null
        ? p.publication.datePrecision !== 'unknown'
        : p.publication.datePrecision === 'unknown'
    )
      issue(['publication'], 'Unknown publication dates must be null');
    if (p.publication.datePrecision === 'month' && !p.publication.publishedDate?.endsWith('-01'))
      issue(['publication'], 'Month precision uses the first day');
    const ids = new Set<string>();
    for (const entry of [...p.assets, ...p.macro, ...p.issues, ...p.reviews]) {
      if (ids.has(entry.id)) issue([], `Duplicate record ID: ${entry.id}`);
      ids.add(entry.id);
    }
    const contexts = new Set<string>();
    p.assetContexts.forEach((c, i) => {
      if (contexts.has(c.observationId))
        issue(['assetContexts', i], 'Duplicate observation context');
      contexts.add(c.observationId);
      const o = p.assets.find((o) => o.id === c.observationId);
      if (!o) issue(['assetContexts', i], 'Unknown observation reference');
      const h = c.horizon;
      if (
        (h.minMonths === null) !== (h.maxMonths === null) ||
        (h.minMonths !== null && h.maxMonths !== null && h.minMonths > h.maxMonths)
      )
        issue(['assetContexts', i, 'horizon'], 'Horizon bounds must be both unknown or ordered');
      if (
        o &&
        (h.original !== o.horizon.original ||
          (o.horizon.months !== null &&
            (h.minMonths !== o.horizon.months || h.maxMonths !== o.horizon.months)))
      )
        issue(
          ['assetContexts', i, 'horizon'],
          'An interval must not be coerced into an exact horizon',
        );
    });
    p.assets.forEach((o, i) => {
      if (o.publicationId !== p.publication.id)
        issue(['assets', i], 'Broken publication reference');
      if (o.firstPublishedAt !== null)
        issue(['assets', i], 'Draft observation cannot have a public release');
      if (o.normalizedStance !== null || o.mappingRuleId !== null)
        issue(
          ['assets', i],
          'Pilot packages retain original labels; normalization requires a later reviewed mapping',
        );
      if ((o.revisionKind === 'initial') !== (o.replacesObservationId === null))
        issue(
          ['assets', i],
          'A revision requires a predecessor; an initial observation must not replace one',
        );
      if ((o.status === 'withdrawn') !== (o.revisionKind === 'withdrawal'))
        issue(['assets', i], 'A source withdrawal must be explicit');
      if ((o.viewType === 'quantitative') !== (o.forecast !== null))
        issue(['assets', i], 'Only quantitative observations carry forecasts');
      if (!contexts.has(o.id)) issue(['assets', i], 'Missing source context');
      if (
        compareInstants(o.verifiedAt, p.publication.firstObservedAt) < 0 ||
        compareInstants(o.verifiedAt, p.provenance.verifiedAt) > 0
      )
        issue(['assets', i], 'Invalid verification chronology');
      const reviews = p.reviews.filter((r) => r.observationId === o.id);
      if (
        reviews.length !== 1 ||
        reviews[0].status !== 'pending' ||
        reviews[0].reviewer !== null ||
        reviews[0].at !== null
      )
        issue(['reviews'], 'Each draft asset needs one pending, unnamed review');
    });
    if (p.reviews.some((r) => !p.assets.some((o) => o.id === r.observationId)))
      issue(['reviews'], 'Orphaned editorial review');
    if (
      p.assetAudit.length !== assetIds.length ||
      new Set(p.assetAudit.map((a) => a.assetId)).size !== assetIds.length
    )
      issue(['assetAudit'], 'Audit all eight catalog assets exactly once');
    p.assetAudit.forEach((a, i) => {
      if ((a.status === 'extracted') !== p.assets.some((o) => o.assetId === a.assetId))
        issue(['assetAudit', i], 'Audit and extracted observations disagree');
    });
    for (const m of p.macro)
      if (m.publicationId !== p.publication.id)
        issue(['macro'], 'Broken macro publication reference');
    for (const i of p.issues)
      if (
        i.targetId &&
        i.targetId !== p.publication.id &&
        !p.assets.some((o) => o.id === i.targetId) &&
        !p.macro.some((m) => m.id === i.targetId)
      )
        issue(['issues'], 'Unknown issue target');
    if (
      p.legacyDraft &&
      (p.legacyDraft.mode !== 'draft' ||
        p.legacyDraft.snapshots.length ||
        p.legacyDraft.publications.length !== 1 ||
        JSON.stringify(p.legacyDraft.publications[0]) !== JSON.stringify(p.publication) ||
        JSON.stringify(p.legacyDraft.observations) !== JSON.stringify(p.assets) ||
        p.legacyDraft.sources.some(
          (s) =>
            s.usage.status !== 'pending_review' ||
            s.usage.reviewer ||
            s.usage.reviewedAt ||
            s.usage.scope,
        ) ||
        p.legacyDraft.reviews.some((r) => r.status !== 'pending' || r.reviewer || r.at))
    )
      issue(
        ['legacyDraft'],
        'Legacy bridge must describe the same pending, unpublished extraction',
      );
  });

export const ResearchInventorySchema = z
  .strictObject({
    schemaVersion: z.literal('research-inventory-1'),
    id: Id,
    periodStart: z.iso.date(),
    cutoff: InstantSchema,
    startedAt: InstantSchema,
    institutions: z.array(InstitutionSchema),
    streams: z.array(
      z.strictObject({
        id: Id,
        institutionId: Id,
        division: Text,
        team: Text,
        series: Text,
        officialUrl: OfficialUrlSchema,
        defaultForInstitution: z.boolean(),
        staleAfterDays: z.number().int().positive().nullable(),
        stalenessBasis: Text,
        usage: z.strictObject({
          status: z.literal('pending_review'),
          reviewer: z.null(),
          reviewedAt: z.null(),
          scope: z.null(),
        }),
      }),
    ),
    publications: z.array(
      z.strictObject({
        id: Id,
        streamId: Id,
        title: Text,
        officialUrl: OfficialUrlSchema,
        publishedDate: z.iso.date().nullable(),
        datePrecision: z.enum(['day', 'month', 'unknown']),
        observedAt: InstantSchema,
        version: Text,
        fingerprint: Text.nullable(),
        supersedesPublicationId: Id.nullable(),
        revisionKind: z.enum(['source_publication', 'source_version', 'extraction_correction']),
        captureKind: CaptureKind,
        access: z.enum(['read', 'metadata_only', 'blocked']),
        periodRole: z.enum(['in_period', 'antecedent']),
        note: Text,
      }),
    ),
    searches: z.array(
      z.strictObject({
        institutionId: Id,
        url: OfficialUrlSchema.nullable(),
        query: Text.nullable(),
        checkedAt: InstantSchema,
        outcome: Text,
      }),
    ),
    gaps: z.array(z.strictObject({ streamId: Id, period: Text, reason: Text })),
  })
  .superRefine((d, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (
      compareInstants(d.startedAt, d.cutoff) < 0 ||
      compareInstants(`${d.periodStart}T00:00:00Z`, d.cutoff) > 0
    )
      issue(['cutoff'], 'Invalid fixed research period');
    for (const key of ['institutions', 'streams', 'publications'] as const)
      if (new Set(d[key].map((x) => x.id)).size !== d[key].length) issue([key], 'Duplicate ID');
    const defaults = new Set<string>();
    d.streams.forEach((s, i) => {
      if (!d.institutions.some((x) => x.id === s.institutionId))
        issue(['streams', i], 'Unknown institution');
      if (s.defaultForInstitution && defaults.has(s.institutionId))
        issue(['streams', i], 'Only one primary series per institution');
      if (s.defaultForInstitution) defaults.add(s.institutionId);
    });
    d.publications.forEach((p, i) => {
      if (!d.streams.some((x) => x.id === p.streamId)) issue(['publications', i], 'Unknown stream');
      if ((p.publishedDate === null) !== (p.datePrecision === 'unknown'))
        issue(['publications', i], 'Date precision disagrees');
      if (p.datePrecision === 'month' && !p.publishedDate?.endsWith('-01'))
        issue(['publications', i], 'Month precision uses first day');
      if (p.publishedDate && p.publishedDate < d.periodStart !== (p.periodRole === 'antecedent'))
        issue(['publications', i], 'Incorrect period role');
      // An edition dated only to the open month remains inventoried, but selectors
      // conservatively exclude it until month end. Do not discard its bibliography.
      if (p.publishedDate && compareInstants(`${p.publishedDate}T00:00:00Z`, d.cutoff) > 0)
        issue(['publications', i], 'Publication beyond fixed cutoff');
      if (p.supersedesPublicationId) {
        const prior = d.publications.find((x) => x.id === p.supersedesPublicationId);
        if (
          !prior ||
          prior.streamId !== p.streamId ||
          compareInstants(prior.observedAt, p.observedAt) >= 0
        )
          issue(
            ['publications', i],
            'Version must follow earlier captured publication in same stream',
          );
      } else if (p.revisionKind !== 'source_publication')
        issue(['publications', i], 'A version/correction requires a predecessor');
      if (
        d.publications
          .slice(0, i)
          .some(
            (x) =>
              x.streamId === p.streamId &&
              x.officialUrl === p.officialUrl &&
              x.version === p.version,
          )
      )
        issue(['publications', i], 'Duplicate URL/content version');
    });
    for (const s of d.searches)
      if (!d.institutions.some((i) => i.id === s.institutionId))
        issue(['searches'], 'Unknown institution');
    for (const g of d.gaps)
      if (!d.streams.some((s) => s.id === g.streamId)) issue(['gaps'], 'Unknown stream');
  });
export type ResearchPackage = z.infer<typeof ResearchPackageSchema>;
export type ResearchInventory = z.infer<typeof ResearchInventorySchema>;

export function validateResearchSet(inventory: ResearchInventory, packets: ResearchPackage[]) {
  ResearchInventorySchema.parse(inventory);
  const seen = new Set<string>();
  for (const raw of packets) {
    const p = ResearchPackageSchema.parse(raw);
    if (seen.has(p.publication.id)) throw new Error(`Duplicate package: ${p.publication.id}`);
    seen.add(p.publication.id);
    const item = inventory.publications.find((x) => x.id === p.publication.id);
    if (!item || item.access !== 'read')
      throw new Error(`No read inventory publication: ${p.publication.id}`);
    for (const key of [
      'streamId',
      'title',
      'officialUrl',
      'publishedDate',
      'datePrecision',
      'version',
      'fingerprint',
    ] as const)
      if (item[key] !== p.publication[key])
        throw new Error(`Inventory/package mismatch: ${p.publication.id}.${key}`);
    if (
      item.captureKind !== p.provenance.captureKind ||
      item.observedAt !== p.publication.firstObservedAt
    )
      throw new Error(`Capture mismatch: ${item.id}`);
  }
  for (const item of inventory.publications)
    if (item.access === 'read' && !seen.has(item.id))
      throw new Error(`Missing extraction package: ${item.id}`);
  const records = packets.flatMap((p) =>
    p.assets.map((o) => ({ observation: o, streamId: p.publication.streamId })),
  );
  if (new Set(records.map((r) => r.observation.id)).size !== records.length)
    throw new Error('Duplicate observation ID across packages');
  const allIds = packets.flatMap((p) =>
    [...p.assets, ...p.macro, ...p.issues, ...p.reviews].map((r) => r.id),
  );
  if (new Set(allIds).size !== allIds.length)
    throw new Error('Duplicate research record ID across packages');
  for (const r of records)
    if (r.observation.replacesObservationId) {
      const prior = records.find((p) => p.observation.id === r.observation.replacesObservationId);
      if (
        !prior ||
        prior.streamId !== r.streamId ||
        prior.observation.assetId !== r.observation.assetId ||
        compareInstants(prior.observation.verifiedAt, r.observation.verifiedAt) >= 0
      )
        throw new Error(`Invalid observation predecessor: ${r.observation.id}`);
    }
}
