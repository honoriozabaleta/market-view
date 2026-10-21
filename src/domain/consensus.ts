import { HOUSE_IDS, type AssetId, type HouseId, type Score } from './catalog';
import type { Call, Edition, Forecast } from './schema';

/**
 * The consensus measure is deliberately simple and transparent:
 * count the houses on each side of neutral, take the average score,
 * and describe the result with a verdict. Missing views are excluded, never treated as neutral.
 */

export type Bucket = 'ow' | 'n' | 'uw';
export const bucketOf = (s: Score): Bucket => (s > 0 ? 'ow' : s < 0 ? 'uw' : 'n');

export type Tone = 'ow' | 'lo' | 'n' | 'lu' | 'uw' | 'split' | 'none';
export interface Verdict {
  id:
    | 'consensus-ow'
    | 'consensus-uw'
    | 'consensus-n'
    | 'leaning-ow'
    | 'leaning-uw'
    | 'mostly-n'
    | 'split'
    | 'insufficient';
  label: string;
  tone: Tone;
}

/** Fewer explicit views than this and we do not describe a consensus. */
export const MIN_VIEWS = 3;
/** Share of houses on one side needed to call it a consensus. */
export const CONSENSUS_SHARE = 0.8;
/** Average score beyond which the group is "leaning" one way. */
export const LEANING_AVG = 0.3;
/** A source older than this (vs the edition cut-off) is flagged as old. */
export const STALE_AFTER_DAYS = 75;

export interface ConsensusStats {
  n: number;
  missing: number;
  avg: number | null;
  sd: number | null;
  counts: Record<Bucket, number>;
  mode: Bucket | null;
  agreement: number | null;
  verdict: Verdict;
}

export function consensusOf(scores: readonly (Score | null)[]): ConsensusStats {
  const xs = scores.filter((s): s is Score => s !== null);
  const n = xs.length;
  const counts: Record<Bucket, number> = { ow: 0, n: 0, uw: 0 };
  xs.forEach((s) => counts[bucketOf(s)]++);
  const missing = scores.length - n;
  if (n === 0)
    return {
      n,
      missing,
      avg: null,
      sd: null,
      counts,
      mode: null,
      agreement: null,
      verdict: VERDICTS.insufficient,
    };
  const avg = xs.reduce<number>((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce<number>((a, b) => a + (b - avg) ** 2, 0) / n);
  const mode = (['n', 'ow', 'uw'] as const).reduce(
    (best, b) => (counts[b] > counts[best] ? b : best),
    'n' as Bucket,
  );
  const agreement = counts[mode] / n;
  return {
    n,
    missing,
    avg,
    sd,
    counts,
    mode,
    agreement,
    verdict: verdictFor(n, avg, mode, agreement),
  };
}

const VERDICTS = {
  insufficient: { id: 'insufficient', label: 'Too few views', tone: 'none' },
  consensusOw: { id: 'consensus-ow', label: 'Consensus overweight', tone: 'ow' },
  consensusUw: { id: 'consensus-uw', label: 'Consensus underweight', tone: 'uw' },
  consensusN: { id: 'consensus-n', label: 'Consensus neutral', tone: 'n' },
  leaningOw: { id: 'leaning-ow', label: 'Leaning overweight', tone: 'lo' },
  leaningUw: { id: 'leaning-uw', label: 'Leaning underweight', tone: 'lu' },
  mostlyN: { id: 'mostly-n', label: 'Mostly neutral', tone: 'n' },
  split: { id: 'split', label: 'Split', tone: 'split' },
} satisfies Record<string, Verdict>;

function verdictFor(n: number, avg: number, mode: Bucket, agreement: number): Verdict {
  if (n < MIN_VIEWS) return VERDICTS.insufficient;
  if (agreement >= CONSENSUS_SHARE)
    return mode === 'ow'
      ? VERDICTS.consensusOw
      : mode === 'uw'
        ? VERDICTS.consensusUw
        : VERDICTS.consensusN;
  if (avg >= LEANING_AVG) return VERDICTS.leaningOw;
  if (avg <= -LEANING_AVG) return VERDICTS.leaningUw;
  if (mode === 'n' && agreement >= 0.6) return VERDICTS.mostlyN;
  return VERDICTS.split;
}

export type ChangeKind = 'upgrade' | 'downgrade' | 'new' | 'dropped';
export interface Change {
  house: HouseId;
  asset: AssetId;
  kind: ChangeKind;
  from: Call;
  to: Call;
}

/** Call-by-call differences between an edition and the previous comparable one. */
export function changesBetween(cur: Edition, prev: Edition | null): Change[] {
  if (!prev) return [];
  const out: Change[] = [];
  for (const h of cur.houses) {
    const ph = prev.houses.find((p) => p.house === h.house);
    if (!ph) continue;
    for (const to of h.calls) {
      const from = ph.calls.find((c) => c.asset === to.asset);
      if (!from) continue;
      let kind: ChangeKind | null = null;
      if (from.score !== null && to.score !== null && from.score !== to.score)
        kind = to.score > from.score ? 'upgrade' : 'downgrade';
      else if (from.score === null && to.score !== null) kind = 'new';
      else if (from.score !== null && to.score === null) kind = 'dropped';
      if (kind) out.push({ house: h.house, asset: to.asset, kind, from, to });
    }
  }
  return out;
}

/** Editions are only compared with editions of the same nature: invented data never meets real data. */
export function isComparable(a: Edition, b: Edition) {
  return (a.status === 'illustrative') === (b.status === 'illustrative');
}

export function previousComparable(editions: readonly Edition[], cur: Edition): Edition | null {
  const earlier = editions.filter((e) => e.id < cur.id && isComparable(e, cur));
  return earlier.length ? earlier[earlier.length - 1] : null;
}

export function ageInDays(published: string, cutoff: string) {
  return Math.round((Date.parse(cutoff) - Date.parse(published)) / 86_400_000);
}

export interface ForecastSummary {
  forecast: Forecast;
  values: { house: HouseId; value: number | null }[];
  count: number;
  median: number | null;
  low: number | null;
  high: number | null;
  /** Median versus today's level: basis points for rates, percent otherwise. */
  delta: { value: number; unit: 'bp' | '%' } | null;
}

export function summarizeForecast(f: Forecast): ForecastSummary {
  const values = HOUSE_IDS.map((house) => ({ house, value: f.values[house]?.value ?? null }));
  const nums = values
    .map((v) => v.value)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const count = nums.length;
  const median = !count
    ? null
    : count % 2
      ? nums[(count - 1) / 2]
      : (nums[count / 2 - 1] + nums[count / 2]) / 2;
  let delta: ForecastSummary['delta'] = null;
  if (median !== null && f.spot !== null && f.kind !== 'growth') {
    delta =
      f.kind === 'rate'
        ? { value: Math.round((median - f.spot) * 100), unit: 'bp' }
        : { value: (median / f.spot - 1) * 100, unit: '%' };
  }
  return {
    forecast: f,
    values,
    count,
    median,
    low: count ? nums[0] : null,
    high: count ? nums[count - 1] : null,
    delta,
  };
}
