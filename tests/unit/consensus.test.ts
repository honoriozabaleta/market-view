import { describe, expect, it } from 'vitest';
import {
  changesBetween,
  consensusOf,
  previousComparable,
  summarizeForecast,
} from '../../src/domain/consensus';
import { buildModel } from '../../src/domain/model';
import { parseEditions } from '../../src/data/editions';
import { editionSchema, type Edition } from '../../src/domain/schema';
import q3 from '../../data/editions/2026-q3.json';
import q4 from '../../data/editions/2026-q4.json';

const E3 = editionSchema.parse(q3);
const E4 = editionSchema.parse(q4);

describe('consensusOf', () => {
  it('calls a consensus when at least 80% of views sit on one side', () => {
    const s = consensusOf([1, 1, 0, 1, 1]);
    expect(s.counts).toEqual({ ow: 4, n: 1, uw: 0 });
    expect(s.avg).toBeCloseTo(0.8);
    expect(s.agreement).toBeCloseTo(0.8);
    expect(s.verdict.id).toBe('consensus-ow');
  });

  it('excludes missing views instead of treating them as neutral', () => {
    const s = consensusOf([1, 1, null, 1, 0]);
    expect(s.n).toBe(4);
    expect(s.missing).toBe(1);
    expect(s.counts.n).toBe(1);
    expect(s.avg).toBeCloseTo(0.75);
    expect(s.verdict.id).toBe('leaning-ow');
  });

  it('reports a split when houses spread across both sides', () => {
    expect(consensusOf([-1, -1, 0, 1, 1]).verdict.id).toBe('split');
  });

  it('distinguishes leaning, mostly neutral and consensus neutral', () => {
    expect(consensusOf([0, 0, -1, 0, -1]).verdict.id).toBe('leaning-uw');
    expect(consensusOf([0, 0, 0, 1, -1]).verdict.id).toBe('mostly-n');
    expect(consensusOf([0, 0, -1, 0, 0]).verdict.id).toBe('consensus-n');
  });

  it('refuses to describe a consensus with fewer than three views', () => {
    expect(consensusOf([1, 1, null, null, null]).verdict.id).toBe('insufficient');
    expect(consensusOf([null, null]).avg).toBeNull();
  });
});

describe('changes between editions', () => {
  it('finds upgrades and downgrades call by call', () => {
    const changes = changesBetween(E4, E3);
    const kinds = changes.map((c) => `${c.house}:${c.asset}:${c.kind}`).sort();
    expect(kinds).toEqual(
      [
        'blk:us-equities:downgrade',
        'blk:us-treasuries:upgrade',
        'gs:em-equities:downgrade',
        'jpm:japan-equities:upgrade',
        'ms:europe-equities:downgrade',
        'ms:hy-credit:downgrade',
        'ubs:gold:upgrade',
      ].sort(),
    );
  });

  it('never compares illustrative data with real data', () => {
    const real: Edition = { ...E4, id: '2026-q4', status: 'draft' };
    expect(previousComparable([E3, real], real)).toBeNull();
    expect(previousComparable([E3, E4], E4)?.id).toBe('2026-q3');
  });
});

describe('edition model', () => {
  const m = buildModel(E4, E3);
  it('summarises the headline consensus and split', () => {
    expect(m.strongest?.asset.id).toBe('us-equities');
    expect(m.split?.asset.id).toBe('us-dollar');
    expect(m.callCount).toBe(59);
  });
  it('flags sources older than the freshness window', () => {
    expect(m.houses.find((h) => h.house.id === 'gs')?.stale).toBe(true);
    expect(m.houses.find((h) => h.house.id === 'jpm')?.stale).toBe(false);
  });
});

describe('forecast summary', () => {
  it('uses the median and expresses rate moves in basis points', () => {
    const ff = summarizeForecast(E4.forecasts.find((f) => f.id === 'ff')!);
    expect(ff.median).toBe(3.25);
    expect(ff.delta).toEqual({ value: -50, unit: 'bp' });
    const spx = summarizeForecast(E4.forecasts.find((f) => f.id === 'spx')!);
    expect(spx.count).toBe(4);
    expect(spx.median).toBe(7750);
  });
});

describe('edition validation', () => {
  it('rejects an edition that skips an asset or invents a label without a score', () => {
    const broken = structuredClone(q4) as unknown as { houses: { calls: unknown[] }[] };
    broken.houses[0].calls = broken.houses[0].calls.slice(1);
    const r = parseEditions({ 'broken.json': broken });
    expect(r.editions).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/Missing call for us-equities/);

    const mislabeled = structuredClone(q4) as unknown as {
      houses: { calls: { score: unknown }[] }[];
    };
    mislabeled.houses[0].calls[0].score = null;
    expect(editionSchema.safeParse(mislabeled).success).toBe(false);
  });

  it('rejects non-HTTPS sources and sources dated after the cut-off', () => {
    const http = structuredClone(q4) as unknown as {
      houses: { source: { url: string; published: string } }[];
    };
    http.houses[0].source.url = 'http://example.com';
    expect(editionSchema.safeParse(http).success).toBe(false);
    const late = structuredClone(q4) as unknown as { houses: { source: { published: string } }[] };
    late.houses[0].source.published = '2026-12-31';
    expect(editionSchema.safeParse(late).success).toBe(false);
  });
});
