import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
import template from '../../templates/publication-draft.json';
import {
  ResearchPackageSchema,
  ResearchInventorySchema,
  validateResearchSet,
  MacroForecastSchema,
  type ResearchInventory,
} from '../../src/domain/research';
import { researchCell } from '../../src/domain/research-selectors';
import { assetIds } from '../../src/domain/schema';

function fixture() {
  const publication = {
    ...structuredClone(template.publications[0]),
    id: 'test-publication',
    streamId: 'test-stream',
    title: 'Fictional research validation double',
    officialUrl: 'https://example.com/test',
    publishedDate: '2026-08-01',
    datePrecision: 'day' as const,
    firstObservedAt: '2026-10-20T16:00:00Z',
    version: 'test-1',
  };
  const asset = {
    ...structuredClone(template.observations[0]),
    id: 'test-observation',
    publicationId: publication.id,
    verifiedAt: '2026-10-20T16:01:00Z',
    horizon: { original: '6–12 months', months: null },
  };
  const packet = ResearchPackageSchema.parse({
    schemaVersion: 'research-package-1',
    publication,
    provenance: {
      sourceUrl: publication.officialUrl,
      capturedAt: publication.firstObservedAt,
      verifiedAt: asset.verifiedAt,
      captureKind: 'dated_document',
      fingerprint: null,
      versionNote: 'Synthetic validation double only',
    },
    assets: [asset],
    reviews: [{ ...template.reviews[0], id: 'test-review', observationId: asset.id }],
    assetContexts: [
      {
        observationId: asset.id,
        sourceAsOf: null,
        sourceAsOfOriginal: null,
        horizon: { original: '6–12 months', minMonths: 6, maxMonths: 12 },
      },
    ],
    assetAudit: assetIds.map((assetId) => ({
      assetId,
      status: assetId === asset.assetId ? 'extracted' : 'not_discussed',
      note: 'Synthetic test audit',
    })),
    macro: [],
    issues: [],
    review: { status: 'pending', reviewer: null, at: null },
    legacyDraft: null,
  });
  const inventory = ResearchInventorySchema.parse({
    schemaVersion: 'research-inventory-1',
    id: 'test-pilot',
    periodStart: '2026-07-01',
    cutoff: '2026-10-20T15:59:53Z',
    startedAt: '2026-10-20T15:59:53Z',
    institutions: [
      {
        id: 'test-institution',
        name: 'Fictional test institution',
        kind: 'research_firm',
        isFictional: true,
      },
    ],
    streams: [
      {
        id: 'test-stream',
        institutionId: 'test-institution',
        division: 'Test',
        team: 'Test',
        series: 'Test',
        officialUrl: 'https://example.com/test',
        defaultForInstitution: true,
        staleAfterDays: null,
        stalenessBasis: 'Pending test policy',
        usage: { status: 'pending_review', reviewer: null, reviewedAt: null, scope: null },
      },
    ],
    publications: [
      {
        id: publication.id,
        streamId: publication.streamId,
        title: publication.title,
        officialUrl: publication.officialUrl,
        publishedDate: publication.publishedDate,
        datePrecision: 'day',
        observedAt: publication.firstObservedAt,
        version: publication.version,
        fingerprint: null,
        supersedesPublicationId: null,
        revisionKind: 'source_publication',
        captureKind: 'dated_document',
        access: 'read',
        periodRole: 'in_period',
        note: 'Test only',
      },
    ],
    searches: [],
    gaps: [],
  });
  return { packet, inventory };
}
describe('private research contracts and temporal diagnostics', () => {
  it('preserves interval horizons, null policy and pending reviews without inventing a legacy dataset', () => {
    const { packet, inventory } = fixture();
    validateResearchSet(inventory, [packet]);
    expect(packet.assets[0].horizon.months).toBeNull();
    expect(packet.legacyDraft).toBeNull();
    const cell = researchCell(
      inventory,
      [packet],
      'test-stream',
      'us-equities',
      '2026-09-30T23:59:59Z',
      '2026-10-20T17:00:00Z',
    );
    expect(cell.current?.observation.id).toBe('test-observation');
    expect(cell.reasons.join(';')).toContain('Source horizon is an interval (6–12 months)');
    expect(cell.reasons.join(';')).toContain('pending owner');
    expect(
      researchCell(
        inventory,
        [packet],
        'test-stream',
        'us-equities',
        '2026-09-30T23:59:59Z',
        '2026-09-30T23:59:59Z',
      ).current,
    ).toBeNull();
  });
  it('rejects broken references, coerced ranges, unsafe URLs and invented approvals', () => {
    const { packet } = fixture();
    const broken = structuredClone(packet);
    broken.macro.push({
      id: 'macro-test',
      publicationId: 'missing',
      topic: 'inflation',
      geography: null,
      scenario: { originalLabel: null, kind: 'unspecified', probabilityPercent: null },
      claim: { text: 'Test', evidence: { citation: 'Test', locator: 'Test' } },
      forecast: null,
      risks: [],
      catalysts: [],
      review: { status: 'pending', reviewer: null, at: null },
    });
    expect(ResearchPackageSchema.safeParse(broken).success).toBe(false);
    const coerced = structuredClone(packet);
    coerced.assets[0].horizon.months = 12;
    expect(ResearchPackageSchema.safeParse(coerced).success).toBe(false);
    expect(
      ResearchPackageSchema.safeParse({
        ...packet,
        review: { status: 'approved', reviewer: 'Invented', at: '2026-10-20T17:00:00Z' },
      }).success,
    ).toBe(false);
    expect(
      ResearchPackageSchema.safeParse({
        ...packet,
        provenance: { ...packet.provenance, sourceUrl: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);
  });
  it('preserves measurement bases and missing dates and rejects inverted macro ranges', () => {
    const f = {
      kind: 'point',
      indicator: 'Inflation',
      unit: '%',
      targetPeriod: '2027',
      sourceAsOf: null,
      value: 2,
      basis: 'annual average',
    };
    expect(MacroForecastSchema.parse(f).basis).toBe('annual average');
    expect(MacroForecastSchema.parse({ ...f, basis: 'year-on-year' }).basis).toBe('year-on-year');
    expect(
      MacroForecastSchema.safeParse({ ...f, kind: 'range', value: undefined, low: 4, high: 2 })
        .success,
    ).toBe(false);
    const { inventory, packet } = fixture();
    inventory.publications[0].publishedDate = null;
    inventory.publications[0].datePrecision = 'unknown';
    packet.publication.publishedDate = null;
    packet.publication.datePrecision = 'unknown';
    validateResearchSet(inventory, [packet]);
    expect(
      researchCell(
        inventory,
        [packet],
        'test-stream',
        'us-equities',
        inventory.cutoff,
        '2026-10-21T00:00:00Z',
      ).current,
    ).toBeNull();
  });
  it('rejects duplicate versions and inventory mismatches', () => {
    const { inventory, packet } = fixture();
    expect(() => validateResearchSet(inventory, [packet, packet])).toThrow('Duplicate package');
    expect(() => validateResearchSet(inventory, [])).toThrow('Missing extraction package');
    const duplicated: ResearchInventory = {
      ...inventory,
      publications: [...inventory.publications, { ...inventory.publications[0], id: 'another-id' }],
    };
    expect(ResearchInventorySchema.safeParse(duplicated).success).toBe(false);
    expect(() =>
      validateResearchSet(inventory, [
        { ...packet, publication: { ...packet.publication, version: 'different' } },
      ]),
    ).toThrow('version');
  });
  it('keeps month-only open-quarter editions in bibliography but excludes them from an exact cut', () => {
    const { inventory, packet } = fixture();
    inventory.publications[0].publishedDate = '2026-10-01';
    inventory.publications[0].datePrecision = 'month';
    packet.publication.publishedDate = '2026-10-01';
    packet.publication.datePrecision = 'month';
    validateResearchSet(inventory, [packet]);
    expect(
      researchCell(
        inventory,
        [packet],
        'test-stream',
        'us-equities',
        inventory.cutoff,
        '2026-10-21T00:00:00Z',
      ).current,
    ).toBeNull();
    inventory.publications[0].publishedDate = '2026-11-01';
    expect(ResearchInventorySchema.safeParse(inventory).success).toBe(false);
  });
  it('does not erase an omitted asset with a partial newer publication or unavailable correction', () => {
    const { inventory, packet } = fixture();
    const later = structuredClone(packet);
    later.publication.id = 'later';
    later.publication.publishedDate = '2026-09-01';
    later.assets = [];
    later.assetContexts = [];
    later.reviews = [];
    later.assetAudit = later.assetAudit.map((a) => ({ ...a, status: 'not_discussed' }));
    inventory.publications.push({
      ...inventory.publications[0],
      id: 'later',
      publishedDate: '2026-09-01',
      version: 'later',
      supersedesPublicationId: 'test-publication',
      revisionKind: 'source_version',
      observedAt: '2026-10-20T16:01:00Z',
    });
    const cell = researchCell(
      inventory,
      [packet, later],
      'test-stream',
      'us-equities',
      inventory.cutoff,
      '2026-10-21T00:00:00Z',
    );
    expect(cell.current?.observation.id).toBe('test-observation');
    expect(cell.notRenewed).toBe(true);
    later.provenance.verifiedAt = '2026-10-22T00:00:00Z';
    expect(
      researchCell(
        inventory,
        [packet, later],
        'test-stream',
        'us-equities',
        inventory.cutoff,
        '2026-10-21T00:00:00Z',
      ).current?.observation.id,
    ).toBe('test-observation');
  });
});

const workspace = `.local/test-research-${process.pid}`;
const input = `${workspace}/input.json`;
const run = (...args: string[]) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'scripts/research.ts', ...args], {
    encoding: 'utf8',
  });
afterAll(() => {
  const target = resolve(workspace);
  if (relative(resolve('.local'), target).startsWith('..') || target === resolve('.local'))
    throw new Error('Unsafe test cleanup path');
  rmSync(target, { recursive: true, force: true });
});
it('runs real private import, validation and escaped review commands with no overwrites', () => {
  const { inventory, packet } = fixture();
  packet.assets[0].thesis.text = '<script>untrusted source text</script> | table';
  mkdirSync(`${workspace}/packages`, { recursive: true });
  writeFileSync(`${workspace}/inventory.json`, JSON.stringify(inventory));
  writeFileSync(input, JSON.stringify(packet));
  expect(run('import', input, workspace).status).toBe(0);
  expect(run('import', input, workspace).stderr).toContain('EEXIST');
  expect(run('validate', workspace).status).toBe(0);
  const result = run('review', workspace, `${workspace}/review`);
  expect(result.status, result.stderr).toBe(0);
  const sheet = readFileSync(`${workspace}/review/test-publication.md`, 'utf8');
  expect(sheet).toContain('&lt;script&gt;');
  expect(sheet).not.toContain('<script>');
  expect(sheet).toContain('6–12 months');
  expect(sheet).toContain('PRIVATE DRAFT');
  expect(run('review', workspace, `${workspace}/review`).stderr).toContain('EEXIST');
  expect(run('review', workspace, 'data/published/test-review').stderr).toContain(
    'must stay under',
  );
});
