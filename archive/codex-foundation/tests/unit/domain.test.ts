import { describe, expect, it } from 'vitest';
import raw from '../../data/demo/dataset.json';
import published from '../../data/published/dataset.json';
import draftTemplate from '../../templates/publication-draft.json';
import {
  DatasetSchema,
  OfficialUrlSchema,
  publicationUpperBound,
  type Dataset,
} from '../../src/domain/schema';
import {
  availableQuarters,
  changeBetween,
  defaultCohort,
  descriptiveCounts,
  eligibleObservations,
  latestObservation,
  selectCell,
  selectedStreams,
  snapshotQuery,
} from '../../src/domain/selectors';
import { assertArchiveIntegrity } from '../../scripts/archive-integrity';
const data = DatasetSchema.parse(raw);
const now = data.asOf!;
const query = { cutoff: now, nature: 'recorded' as const };
const stream = (id: string) => data.streams.find((s) => s.id === `${id}-stream`)!;
const cell = (team: string, asset: Parameters<typeof selectCell>[2]) =>
  selectCell(data, stream(team), asset, query);
const observation = (id: string) => data.observations.find((o) => o.id === id)!;
const copy = () => structuredClone(data);
// Deliberate validation doubles, never institutional research or app data.
function approvedTestDouble(): Dataset {
  const value = DatasetSchema.parse(draftTemplate);
  value.mode = 'published';
  value.institutions[0].name = 'TEST ONLY organization stub';
  value.streams[0].division = 'TEST division';
  value.streams[0].team = 'TEST team';
  value.streams[0].series = 'TEST series';
  const p = value.publications[0];
  p.title = 'TEST ONLY publication stub';
  p.version = 'test-v1';
  p.editorialState = 'published';
  p.officialUrl = 'https://example.com/test-report';
  p.publishedDate = '2026-01-10';
  p.datePrecision = 'day';
  p.firstObservedAt = '2026-01-10T09:00:00Z';
  p.marketViewPublishedAt = '2026-01-11T12:00:00Z';
  const s = value.sources[0];
  s.officialUrl = 'https://example.com';
  s.verifiedAt = '2026-01-10T09:00:00Z';
  s.usage = {
    status: 'approved_scope',
    scope: 'TEST ONLY validation scope',
    reviewer: 'TEST ONLY reviewer stub',
    reviewedAt: '2026-01-10T10:00:00Z',
  };
  const o = value.observations[0];
  o.originalAsset = 'TEST asset';
  o.originalUniverse = 'TEST universe';
  o.evidence = { citation: 'TEST ONLY bibliographic stub', locator: 'TEST section' };
  o.thesis = { text: 'TEST ONLY analytical stub', evidence: o.evidence };
  o.verifiedAt = '2026-01-10T10:00:00Z';
  o.firstPublishedAt = '2026-01-11T12:00:00Z';
  value.reviews[0] = {
    id: 'test-review',
    observationId: o.id,
    status: 'approved',
    reviewer: 'TEST ONLY reviewer stub',
    at: '2026-01-11T10:00:00Z',
    rationale: 'TEST ONLY validation double; no human approval claimed',
  };
  return value;
}
describe('financial comparison', () => {
  it('keeps missing, unmapped, stale and neutral distinct', () => {
    expect(cell('paper-moon', 'em-equities').status).toBe('not-disclosed');
    expect(cell('paper-moon', 'hy-credit').status).toBe('not-comparable');
    expect(cell('paper-moon', 'us-treasuries').status).toBe('neutral');
    expect(cell('imaginary-harbor', 'gold').status).toBe('stale');
  });
  it('separates allocation, directional, quantitative and narrative views', () => {
    expect(cell('paper-moon', 'ig-credit').reasons).toContain('View type: directional');
    expect(cell('imaginary-harbor', 'us-dollar').reasons).toContain('View type: quantitative');
    expect(cell('fable-grove', 'hy-credit').reasons).toContain('View type: narrative');
  });
  it('requires exact known horizons and universes', () => {
    expect(cell('imaginary-harbor', 'us-equities').status).toBe('not-comparable');
    expect(
      selectCell(
        data,
        stream('imaginary-harbor'),
        'us-equities',
        query,
        defaultCohort('us-equities', 3),
      ).status,
    ).toBe('neutral');
    expect(cell('imaginary-harbor', 'ig-credit').reasons).toContain(
      'Different universe or geography',
    );
    expect(cell('paper-moon', 'hy-credit').reasons).toContain('Horizon not disclosed');
  });
  it('uses source publication age even after recent verification', () => {
    expect(cell('imaginary-harbor', 'gold').observation?.verifiedAt).toContain('2026-05-12');
    expect(cell('imaginary-harbor', 'gold').status).toBe('stale');
  });
  it('preserves the date and not-renewed flag after a partial publication', () => {
    const gold = cell('paper-moon', 'gold');
    expect(gold.notRenewed).toBe(true);
    expect(gold.observation?.publicationId).toBe('demo-paper-q1');
    expect(gold.status).toBe('favorable');
  });
  it('respects explicit withdrawals', () => {
    expect(cell('fable-grove', 'gold').status).toBe('withdrawn');
  });
  it('counts one selected stream per institution and exposes denominator/exclusions', () => {
    const counts = descriptiveCounts(
      selectedStreams(data).map((s) => selectCell(data, s, 'us-equities', query)),
    );
    expect(counts).toMatchObject({
      denominator: 2,
      cohortSize: 3,
      favorable: 1,
      neutral: 1,
      sufficient: true,
    });
    expect(counts.exclusions).toHaveLength(1);
    expect(descriptiveCounts([cell('paper-moon', 'em-equities')]).sufficient).toBe(false);
  });
  it('distinguishes a genuine view change from extraction correction', () => {
    expect(
      changeBetween(
        data,
        observation('demo-paper-q1-us-equities'),
        observation('demo-paper-q2-us-equities'),
      ),
    ).toContain('View changed');
    expect(
      changeBetween(
        data,
        observation('demo-harbor-q2-us-treasuries'),
        observation('demo-harbor-treasuries-correction'),
      ),
    ).toContain('not an institutional view change');
    expect(cell('imaginary-harbor', 'us-treasuries').observation?.id).toBe(
      'demo-harbor-treasuries-correction',
    );
    expect(
      changeBetween(
        data,
        observation('demo-paper-q1-us-equities'),
        observation('demo-harbor-q2-us-equities'),
      ),
    ).toContain('Comparison boundary');
    expect(
      changeBetween(
        data,
        observation('demo-paper-q1-us-equities'),
        observation('demo-paper-q1-gold'),
      ),
    ).toContain('Comparison boundary');
  });
});
describe('temporal selection and archives', () => {
  it('does not use future publications or late platform additions in recorded history', () => {
    const cut = { cutoff: '2026-03-31T23:59:59Z', nature: 'recorded' as const };
    expect(
      latestObservation(data, stream('paper-moon').id, 'us-equities', cut)?.publicationId,
    ).toBe('demo-paper-q1');
    expect(latestObservation(data, stream('fable-grove').id, 'em-equities', cut)).toBeNull();
    expect(eligibleObservations(data, cut).some((o) => o.id === 'demo-harbor-q1-gold')).toBe(false);
  });
  it('allows explicitly reconstructed older coverage only by knowledge date', () => {
    const cut = {
      cutoff: '2026-03-31T23:59:59Z',
      nature: 'reconstructed' as const,
      knowledgeAt: now,
    };
    expect(
      latestObservation(data, stream('fable-grove').id, 'em-equities', cut)?.publicationId,
    ).toBe('demo-late-import');
    const snapshot = snapshotQuery(data, 'demo-q1-reconstructed-v1')!;
    expect(snapshot.query).toMatchObject({
      nature: 'reconstructed',
      knowledgeAt: '2026-05-15T12:00:00Z',
    });
    expect(snapshot.observations.some((o) => o.id === 'demo-late-import-em-equities')).toBe(true);
  });
  it('does not sort an undated document as latest', () => {
    expect(cell('paper-moon', 'us-equities').observation?.publicationId).toBe('demo-paper-q2');
    expect(eligibleObservations(data, query).some((o) => o.publicationId === 'demo-undated')).toBe(
      false,
    );
  });
  it('pins correction availability at its review and release date', () => {
    const old = latestObservation(data, stream('imaginary-harbor').id, 'us-treasuries', {
      cutoff: '2026-05-07T23:59:59Z',
      nature: 'recorded',
    });
    expect(old?.originalStance).toBe('Overweight');
    expect(cell('imaginary-harbor', 'us-treasuries').observation?.originalStance).toBe('Neutral');
  });
  it('derives quarters and caps the open quarter at its real cutoff', () => {
    expect(availableQuarters(data, now)).toEqual([
      { id: '2026-Q2', cutoff: now, quarterToDate: true },
      { id: '2026-Q1', cutoff: '2026-03-31T23:59:59Z', quarterToDate: false },
    ]);
    expect(availableQuarters(DatasetSchema.parse(published), now)).toEqual([]);
  });
  it('treats month precision conservatively', () => {
    expect(publicationUpperBound({ publishedDate: '2026-04-01', datePrecision: 'month' })).toBe(
      '2026-04-30T23:59:59Z',
    );
  });
  it('compares equal UTC instants regardless of optional milliseconds', () => {
    const cutoff = '2026-04-15T12:00:00.000Z';
    const selected = latestObservation(data, stream('paper-moon').id, 'us-equities', {
      cutoff,
      nature: 'recorded',
    });
    expect(selected?.id).toBe('demo-paper-q2-us-equities');
  });
  it('rejects a snapshot that includes future information or mismatched version', () => {
    const edited = copy();
    edited.snapshots[0].entries.push({
      observationId: 'demo-paper-q2-us-equities',
      publicationId: 'demo-paper-q2',
      publicationVersion: 'fixture-v1',
    });
    expect(DatasetSchema.safeParse(edited).success).toBe(false);
    edited.snapshots[0].entries[0].publicationVersion = 'wrong';
    expect(DatasetSchema.safeParse(edited).success).toBe(false);
  });
  it('protects closed snapshots and evidence while allowing append-only revisions', () => {
    expect(() => assertArchiveIntegrity(data, copy())).not.toThrow();
    const edited = copy();
    edited.snapshots[0].entries.pop();
    expect(() => assertArchiveIntegrity(data, edited)).toThrow('Immutable archive');
    const revised = copy();
    revised.observations.find(
      (o) => o.id === revised.snapshots[0].entries[0].observationId,
    )!.thesis.text = 'Silent edit';
    expect(() => assertArchiveIntegrity(data, revised)).toThrow('Immutable archive');
    const appended = copy();
    appended.snapshots.push({
      ...structuredClone(appended.snapshots[0]),
      id: 'demo-q1-recorded-v2',
      nature: 'reconstructed',
      createdAt: '2026-05-18T00:00:00Z',
      revision: 2,
      supersedesSnapshotId: appended.snapshots[0].id,
    });
    expect(DatasetSchema.safeParse(appended).success).toBe(true);
    expect(() => assertArchiveIntegrity(data, appended)).not.toThrow();
  });
});
describe('validation and editorial boundary', () => {
  it('exercises published eligibility with an explicitly synthetic validation double', () => {
    const value = DatasetSchema.parse(approvedTestDouble());
    expect(
      eligibleObservations(value, { cutoff: '2026-01-10T23:59:59Z', nature: 'recorded' }),
    ).toHaveLength(0);
    expect(
      eligibleObservations(value, { cutoff: '2026-01-11T12:00:00Z', nature: 'recorded' }),
    ).toHaveLength(1);
    value.sources[0].usage.status = 'link_only';
    expect(eligibleObservations(value, { cutoff: now, nature: 'recorded' })).toHaveLength(0);
    expect(DatasetSchema.safeParse(value).success).toBe(false);
  });
  it('rejects delayed source usage approval and template placeholders in public data', () => {
    const late = approvedTestDouble();
    late.sources[0].usage.reviewedAt = '2026-01-12T00:00:00Z';
    expect(DatasetSchema.safeParse(late).success).toBe(false);
    const placeholder = approvedTestDouble();
    placeholder.publications[0].title = 'Owner must replace this';
    expect(DatasetSchema.safeParse(placeholder).success).toBe(false);
  });
  it('validates both fixtures and the honest published empty state', () => {
    expect(DatasetSchema.safeParse(data).success).toBe(true);
    expect(DatasetSchema.safeParse(published).success).toBe(true);
  });
  it('rejects unreviewed or simulated published data', () => {
    const edited = copy();
    edited.mode = 'published';
    expect(DatasetSchema.safeParse(edited).success).toBe(false);
  });
  it('requires a real reviewer and approval dates', () => {
    const edited = copy();
    edited.mode = 'draft';
    edited.reviews[0].status = 'approved';
    edited.reviews[0].reviewer = null;
    expect(DatasetSchema.safeParse(edited).success).toBe(false);
  });
  it('excludes pending/rejected records and records released after the cut', () => {
    const edited = copy();
    edited.reviews.find((r) => r.observationId === 'demo-paper-q2-us-equities')!.status = 'pending';
    expect(
      latestObservation(edited, stream('paper-moon').id, 'us-equities', query)?.publicationId,
    ).toBe('demo-paper-q1');
    edited.reviews.find((r) => r.observationId === 'demo-paper-q2-us-equities')!.status = 'demo';
    edited.observations.find((o) => o.id === 'demo-paper-q2-us-equities')!.firstPublishedAt =
      '2026-06-01T00:00:00Z';
    expect(
      latestObservation(edited, stream('paper-moon').id, 'us-equities', query)?.publicationId,
    ).toBe('demo-paper-q1');
  });
  it('rejects duplicate IDs, duplicate observations and multiple default streams', () => {
    const a = copy();
    a.observations.push(a.observations[0]);
    expect(DatasetSchema.safeParse(a).success).toBe(false);
    const b = copy();
    b.observations.push({ ...b.observations[0], id: 'duplicate-context' });
    expect(DatasetSchema.safeParse(b).success).toBe(false);
    const c = copy();
    c.streams.push({ ...c.streams[0], id: 'second-team' });
    expect(DatasetSchema.safeParse(c).success).toBe(false);
  });
  it('requires exact documented mappings and evidence locators', () => {
    const edited = copy();
    edited.observations[0].originalStance = 'Attractive';
    expect(DatasetSchema.safeParse(edited).success).toBe(false);
    const noEvidence = copy();
    noEvidence.observations[0].thesis.evidence.locator = '';
    expect(DatasetSchema.safeParse(noEvidence).success).toBe(false);
    const wrongCurrency = copy();
    wrongCurrency.observations[0].currency = 'EUR';
    expect(DatasetSchema.safeParse(wrongCurrency).success).toBe(false);
  });
  it('rejects unsafe and credential-bearing URLs', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,test',
      'http://example.com',
      'https://user:secret@example.com',
    ])
      expect(OfficialUrlSchema.safeParse(url).success).toBe(false);
    expect(OfficialUrlSchema.safeParse('https://example.com/report').success).toBe(true);
  });
  it('validates publication versions under a mutable URL without overwriting an earlier version', () => {
    const edited: Dataset = copy();
    edited.publications.push({
      ...edited.publications[0],
      id: 'demo-next-version',
      version: 'fixture-v2',
      firstObservedAt: now,
      marketViewPublishedAt: now,
      supersedesPublicationId: edited.publications[0].id,
    });
    expect(DatasetSchema.safeParse(edited).success).toBe(true);
    expect(edited.publications[0].version).toBe('fixture-v1');
  });
});
