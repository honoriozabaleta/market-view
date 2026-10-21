import { z } from 'zod';

export const assetIds = [
  'us-equities',
  'european-equities',
  'em-equities',
  'us-treasuries',
  'ig-credit',
  'hy-credit',
  'us-dollar',
  'gold',
] as const;
export const AssetIdSchema = z.enum(assetIds);
export const StanceSchema = z.enum(['favorable', 'neutral', 'unfavorable']);
const Id = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/);
const Text = z.string().trim().min(1);
export const InstantSchema = z.iso.datetime();
/** Compare instants, not their spelling: .000Z and Z denote the same instant. */
export function compareInstants(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}
export const OfficialUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Use a public HTTPS URL without credentials');
export const EvidenceSchema = z.strictObject({ citation: Text, locator: Text });
export const ClaimSchema = z.strictObject({ text: Text, evidence: EvidenceSchema });
export const InstitutionSchema = z.strictObject({
  id: Id,
  name: Text,
  kind: z.enum(['asset_manager', 'bank', 'research_firm']),
  isFictional: z.boolean(),
});
export const SourceSchema = z.strictObject({
  id: Id,
  officialUrl: OfficialUrlSchema.nullable(),
  verifiedAt: InstantSchema.nullable(),
  usage: z.strictObject({
    status: z.enum(['pending_review', 'link_only', 'approved_scope', 'excluded', 'demo']),
    scope: Text.nullable(),
    reviewer: Text.nullable(),
    reviewedAt: InstantSchema.nullable(),
  }),
});
export const ResearchStreamSchema = z.strictObject({
  id: Id,
  institutionId: Id,
  sourceId: Id,
  division: Text,
  team: Text,
  series: Text,
  expectedCadenceDays: z.number().int().positive().nullable(),
  staleAfterDays: z.number().int().positive(),
  stalenessBasis: Text,
  defaultForInstitution: z.boolean(),
});
export const PublicationSchema = z.strictObject({
  id: Id,
  streamId: Id,
  title: Text,
  officialUrl: OfficialUrlSchema.nullable(),
  publishedDate: z.iso.date().nullable(),
  datePrecision: z.enum(['day', 'month', 'unknown']),
  firstObservedAt: InstantSchema,
  version: Text,
  fingerprint: Text.nullable(),
  supersedesPublicationId: Id.nullable(),
  editorialState: z.enum(['draft', 'published', 'demo']),
  marketViewPublishedAt: InstantSchema.nullable(),
});
export const UniverseSchema = z.strictObject({
  scope: Text,
  geography: Text,
  currency: Text.nullable(),
});
export const MappingRuleSchema = z.strictObject({
  id: Id,
  streamId: Id,
  viewType: z.literal('allocation'),
  originalLabel: Text,
  normalized: StanceSchema,
  universe: UniverseSchema,
  benchmark: Text,
  horizonMonths: z.number().int().positive(),
  rationale: Text,
});
export const ObservationSchema = z.strictObject({
  id: Id,
  publicationId: Id,
  assetId: AssetIdSchema,
  originalAsset: Text,
  originalUniverse: Text,
  universe: UniverseSchema,
  viewType: z.enum(['allocation', 'directional', 'quantitative', 'narrative']),
  originalStance: Text.nullable(),
  normalizedStance: StanceSchema.nullable(),
  mappingRuleId: Id.nullable(),
  horizon: z.strictObject({
    original: Text.nullable(),
    months: z.number().int().positive().nullable(),
  }),
  benchmark: Text.nullable(),
  currency: Text.nullable(),
  forecast: z.strictObject({ value: z.number(), unit: Text }).nullable(),
  thesis: ClaimSchema,
  risks: z.array(ClaimSchema),
  editorialInterpretation: ClaimSchema.nullable(),
  evidence: EvidenceSchema,
  verifiedAt: InstantSchema,
  firstPublishedAt: InstantSchema.nullable(),
  status: z.enum(['active', 'withdrawn']),
  revisionKind: z.enum(['initial', 'view_update', 'extraction_correction', 'withdrawal']),
  replacesObservationId: Id.nullable(),
});
export const ReviewSchema = z.strictObject({
  id: Id,
  observationId: Id,
  status: z.enum(['pending', 'approved', 'rejected', 'demo']),
  reviewer: Text.nullable(),
  at: InstantSchema.nullable(),
  rationale: Text,
});
export const SnapshotSchema = z.strictObject({
  id: Id,
  cutoff: InstantSchema,
  createdAt: InstantSchema,
  methodologyVersion: Text,
  nature: z.enum(['recorded', 'reconstructed']),
  revision: z.number().int().positive(),
  supersedesSnapshotId: Id.nullable(),
  entries: z.array(
    z.strictObject({ observationId: Id, publicationId: Id, publicationVersion: Text }),
  ),
});

export const DatasetSchema = z
  .strictObject({
    schemaVersion: z.literal('1'),
    methodologyVersion: z.literal('1.0.0'),
    mode: z.enum(['published', 'demo', 'draft']),
    asOf: InstantSchema.nullable(),
    institutions: z.array(InstitutionSchema),
    sources: z.array(SourceSchema),
    streams: z.array(ResearchStreamSchema),
    publications: z.array(PublicationSchema),
    mappings: z.array(MappingRuleSchema),
    observations: z.array(ObservationSchema),
    reviews: z.array(ReviewSchema),
    snapshots: z.array(SnapshotSchema),
  })
  .superRefine((data, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if ((data.mode === 'demo') !== (data.asOf !== null))
      issue(['asOf'], 'Only demo uses an explicit frozen clock; demo requires one');
    if (data.mode === 'published' && /Owner must|owner-must/.test(JSON.stringify(data)))
      issue(['mode'], 'Draft template placeholders cannot be published');
    const lists = [
      'institutions',
      'sources',
      'streams',
      'publications',
      'mappings',
      'observations',
      'reviews',
      'snapshots',
    ] as const;
    for (const key of lists) {
      const ids = new Set<string>();
      data[key].forEach((item, i) => {
        if (ids.has(item.id)) issue([key, i, 'id'], 'Duplicate ID');
        ids.add(item.id);
      });
    }
    const institution = new Map(data.institutions.map((x) => [x.id, x]));
    const sources = new Map(data.sources.map((x) => [x.id, x]));
    const streams = new Map(data.streams.map((x) => [x.id, x]));
    const publications = new Map(data.publications.map((x) => [x.id, x]));
    const observations = new Map(data.observations.map((x) => [x.id, x]));
    const mappings = new Map(data.mappings.map((x) => [x.id, x]));
    const defaults = new Set<string>();
    data.streams.forEach((s, i) => {
      if (!institution.has(s.institutionId) || !sources.has(s.sourceId))
        issue(['streams', i], 'Unknown institution or source');
      if (s.defaultForInstitution && defaults.has(s.institutionId))
        issue(['streams', i], 'Only one default stream per institution');
      if (s.defaultForInstitution) defaults.add(s.institutionId);
    });
    data.sources.forEach((s, i) => {
      if (data.mode === 'published' && !['approved_scope', 'link_only'].includes(s.usage.status))
        issue(['sources', i], 'Published source metadata requires an approved usage assessment');
      if (
        data.mode === 'demo' &&
        (s.officialUrl !== null ||
          s.usage.status !== 'demo' ||
          s.usage.reviewer !== null ||
          s.usage.reviewedAt !== null)
      )
        issue(
          ['sources', i],
          'Demo sources require synthetic usage, no authentic-looking URLs or human review',
        );
      if (
        ['link_only', 'approved_scope', 'excluded'].includes(s.usage.status) &&
        (!s.usage.reviewer || !s.usage.reviewedAt || !s.usage.scope)
      )
        issue(['sources', i, 'usage'], 'Human usage review requires reviewer, date and scope');
      if (data.mode !== 'demo' && s.usage.status === 'demo')
        issue(['sources', i], 'Demo source outside demo');
    });
    data.institutions.forEach((s, i) => {
      if (data.mode === 'demo' ? !s.isFictional : s.isFictional)
        issue(['institutions', i], 'Fictional identities belong only in demo');
    });
    data.publications.forEach((p, i) => {
      if (!streams.has(p.streamId)) issue(['publications', i], 'Unknown stream');
      if ((p.publishedDate === null) !== (p.datePrecision === 'unknown'))
        issue(['publications', i], 'Unknown dates must be null');
      if (p.datePrecision === 'month' && !p.publishedDate?.endsWith('-01'))
        issue(
          ['publications', i],
          'Month precision is stored as the first day; selectors use its upper bound',
        );
      if (
        p.marketViewPublishedAt &&
        compareInstants(p.marketViewPublishedAt, p.firstObservedAt) < 0
      )
        issue(['publications', i], 'Cannot publish before first observation');
      if (p.supersedesPublicationId) {
        const previous = publications.get(p.supersedesPublicationId);
        if (
          !previous ||
          previous.id === p.id ||
          previous.streamId !== p.streamId ||
          compareInstants(previous.firstObservedAt, p.firstObservedAt) >= 0
        )
          issue(
            ['publications', i],
            'Version must follow an earlier publication in the same stream',
          );
      }
      if (
        data.mode === 'published' &&
        (p.editorialState !== 'published' || !p.marketViewPublishedAt || !p.officialUrl)
      )
        issue(
          ['publications', i],
          'Published data requires publication date on Market View and an official URL',
        );
      if (data.mode !== 'demo' && p.editorialState === 'demo')
        issue(['publications', i], 'Demo publication outside demo');
      if (data.mode === 'demo' && p.officialUrl)
        issue(['publications', i], 'Demo evidence must not imitate an official URL');
    });
    const sameUniverse = (a: z.infer<typeof UniverseSchema>, b: z.infer<typeof UniverseSchema>) =>
      a.scope === b.scope && a.geography === b.geography && a.currency === b.currency;
    const duplicates = new Set<string>();
    data.mappings.forEach((m, i) => {
      if (!streams.has(m.streamId)) issue(['mappings', i], 'Unknown mapping stream');
    });
    data.observations.forEach((o, i) => {
      const p = publications.get(o.publicationId);
      if (!p) issue(['observations', i], 'Unknown publication');
      if (p && compareInstants(o.verifiedAt, p.firstObservedAt) < 0)
        issue(['observations', i], 'Verification precedes first observation');
      if (
        o.firstPublishedAt &&
        (compareInstants(o.firstPublishedAt, o.verifiedAt) < 0 ||
          !p?.marketViewPublishedAt ||
          compareInstants(o.firstPublishedAt, p.marketViewPublishedAt) < 0)
      )
        issue(
          ['observations', i],
          'Public release must follow verification and publication release',
        );
      if (o.normalizedStance !== null) {
        const m = mappings.get(o.mappingRuleId ?? '');
        if (
          !m ||
          o.viewType !== 'allocation' ||
          m.streamId !== p?.streamId ||
          m.originalLabel !== o.originalStance ||
          m.normalized !== o.normalizedStance ||
          m.universe.currency !== o.currency ||
          !sameUniverse(m.universe, o.universe) ||
          m.benchmark !== o.benchmark ||
          m.horizonMonths !== o.horizon.months
        )
          issue(
            ['observations', i, 'mappingRuleId'],
            'Normalized allocation requires an exact source/context mapping',
          );
      } else if (o.mappingRuleId !== null)
        issue(['observations', i], 'Unnormalized observation must not claim a mapping');
      if ((o.viewType === 'quantitative') !== (o.forecast !== null))
        issue(['observations', i], 'Only quantitative views carry a forecast');
      if ((o.status === 'withdrawn') !== (o.revisionKind === 'withdrawal'))
        issue(['observations', i], 'Withdrawal must be explicit');
      const previous = observations.get(o.replacesObservationId ?? '');
      if (o.revisionKind === 'initial' ? o.replacesObservationId !== null : !previous)
        issue(
          ['observations', i],
          'Revision requires a prior observation; initial must not replace one',
        );
      if (previous) {
        if (
          previous.id === o.id ||
          compareInstants(previous.verifiedAt, o.verifiedAt) >= 0 ||
          previous.assetId !== o.assetId ||
          publications.get(previous.publicationId)?.streamId !== p?.streamId
        )
          issue(
            ['observations', i],
            'Revision must follow an earlier observation for the same stream and asset',
          );
      }
      const key = JSON.stringify([
        o.publicationId,
        o.assetId,
        o.universe,
        o.viewType,
        o.horizon.months,
        o.benchmark,
        o.currency,
      ]);
      if (duplicates.has(key) && o.revisionKind !== 'extraction_correction')
        issue(
          ['observations', i],
          'Duplicate publication/context; use a linked extraction correction',
        );
      duplicates.add(key);
      const review = data.reviews.filter((r) => r.observationId === o.id);
      if (review.length !== 1)
        issue(
          ['observations', i],
          'Exactly one editorial review record is required per observation revision',
        );
      if (data.mode === 'published') {
        const source = sources.get(streams.get(p?.streamId ?? '')?.sourceId ?? '');
        if (
          !o.firstPublishedAt ||
          review[0]?.status !== 'approved' ||
          source?.usage.status !== 'approved_scope' ||
          !source.officialUrl ||
          !source.verifiedAt
        )
          issue(
            ['observations', i],
            'Public observations require human approval, public release and approved source scope',
          );
        if (
          o.firstPublishedAt &&
          source &&
          ((source.usage.reviewedAt &&
            compareInstants(source.usage.reviewedAt, o.firstPublishedAt) > 0) ||
            (source.verifiedAt && compareInstants(source.verifiedAt, o.firstPublishedAt) > 0))
        )
          issue(
            ['observations', i],
            'Source verification and usage approval must precede public release',
          );
      }
    });
    data.reviews.forEach((r, i) => {
      const o = observations.get(r.observationId);
      if (!o) issue(['reviews', i], 'Unknown observation');
      if (r.status === 'approved' && (!r.reviewer || !r.at))
        issue(['reviews', i], 'Approval requires a real reviewer and date');
      if (
        r.at &&
        o &&
        (compareInstants(r.at, o.verifiedAt) < 0 ||
          (o.firstPublishedAt && compareInstants(r.at, o.firstPublishedAt) > 0))
      )
        issue(['reviews', i], 'Review must follow verification and precede public release');
      if (data.mode !== 'demo' && r.status === 'demo')
        issue(['reviews', i], 'Simulated review outside demo');
      if (data.mode === 'demo' && (r.status !== 'demo' || r.reviewer !== null))
        issue(['reviews', i], 'Demo reviews are simulated, with no invented reviewer');
    });
    data.snapshots.forEach((s, i) => {
      if (s.nature === 'recorded' && compareInstants(s.createdAt, s.cutoff) !== 0)
        issue(
          ['snapshots', i],
          'Recorded captures must use their actual creation instant as cutoff; later captures are reconstructed',
        );
      if (compareInstants(s.createdAt, s.cutoff) < 0)
        issue(['snapshots', i], 'Snapshot cannot be created before its cutoff');
      if (s.methodologyVersion !== data.methodologyVersion)
        issue(['snapshots', i], 'Unknown snapshot methodology');
      if (s.supersedesSnapshotId) {
        const old = data.snapshots.find((x) => x.id === s.supersedesSnapshotId);
        if (
          !old ||
          compareInstants(old.cutoff, s.cutoff) !== 0 ||
          old.revision + 1 !== s.revision ||
          compareInstants(old.createdAt, s.createdAt) >= 0
        )
          issue(
            ['snapshots', i],
            'Snapshot revision must reference an earlier revision with the same cutoff',
          );
      } else if (s.revision !== 1) issue(['snapshots', i], 'First snapshot revision must be 1');
      const included = new Set<string>();
      s.entries.forEach((e, j) => {
        const o = observations.get(e.observationId);
        const p = publications.get(e.publicationId);
        if (included.has(e.observationId))
          issue(['snapshots', i, 'entries', j], 'Duplicate snapshot entry');
        included.add(e.observationId);
        if (!o || o.publicationId !== p?.id || p.version !== e.publicationVersion) {
          issue(['snapshots', i, 'entries', j], 'Snapshot version reference mismatch');
          return;
        }
        const horizon = s.nature === 'recorded' ? s.cutoff : s.createdAt;
        const r = data.reviews.find((x) => x.observationId === o.id);
        if (
          !p.publishedDate ||
          compareInstants(publicationUpperBound(p), s.cutoff) > 0 ||
          compareInstants(p.firstObservedAt, horizon) > 0 ||
          compareInstants(o.verifiedAt, horizon) > 0 ||
          (r?.at && compareInstants(r.at, horizon) > 0) ||
          !o.firstPublishedAt ||
          compareInstants(o.firstPublishedAt, horizon) > 0
        )
          issue(
            ['snapshots', i, 'entries', j],
            'Snapshot includes unavailable or future information',
          );
        if (
          s.nature === 'recorded' &&
          (!p.marketViewPublishedAt || compareInstants(p.marketViewPublishedAt, s.cutoff) > 0)
        )
          issue(
            ['snapshots', i, 'entries', j],
            'Recorded snapshot requires platform availability at cutoff',
          );
      });
    });
  });

export type Dataset = z.infer<typeof DatasetSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type Publication = z.infer<typeof PublicationSchema>;
export type ResearchStream = z.infer<typeof ResearchStreamSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type AssetId = z.infer<typeof AssetIdSchema>;
export type Stance = z.infer<typeof StanceSchema>;

/** A month-only date is eligible only once that whole month has elapsed. */
export function publicationUpperBound(
  p: Pick<Publication, 'publishedDate' | 'datePrecision'>,
): string {
  if (!p.publishedDate) return '9999-12-31T23:59:59Z';
  if (p.datePrecision === 'month') {
    const date = new Date(`${p.publishedDate}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    return `${date.toISOString().slice(0, 10)}T23:59:59Z`;
  }
  return `${p.publishedDate}T00:00:00Z`;
}
