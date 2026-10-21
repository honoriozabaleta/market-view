import {
  ASSETS,
  HOUSES,
  scoreKey,
  type Asset,
  type AssetId,
  type House,
  type HouseId,
  type Score,
  type ScoreKey,
} from './catalog';
import {
  ageInDays,
  bucketOf,
  changesBetween,
  consensusOf,
  STALE_AFTER_DAYS,
  summarizeForecast,
  type Change,
  type ConsensusStats,
  type ForecastSummary,
} from './consensus';
import type { Call, Edition, HouseEdition, Theme } from './schema';

/** Everything the page needs for one edition, derived once from the data. */

export interface HouseRow {
  house: House;
  entry: HouseEdition;
  /** The house's scale wording: what the source showed, falling back to our catalogue. */
  scale: Record<ScoreKey, string>;
  ageDays: number;
  stale: boolean;
  leans: { asset: Asset; call: Call }[];
  avoids: { asset: Asset; call: Call }[];
}

export interface CallCell {
  house: House;
  call: Call;
  change: Change | null;
}

export interface AssetRow {
  asset: Asset;
  cells: CallCell[];
  stats: ConsensusStats;
}

export interface Headline {
  asset: Asset;
  stats: ConsensusStats;
}

export interface EditionModel {
  edition: Edition;
  previous: Edition | null;
  houses: HouseRow[];
  assets: AssetRow[];
  changes: Change[];
  strongest: Headline | null;
  split: Headline | null;
  callCount: number;
  forecasts: ForecastSummary[];
  themes: Theme[];
}

export function labelFor(row: HouseRow, score: Score | null, original?: string | null) {
  if (score === null) return 'No view published';
  return original ?? row.scale[scoreKey(score)];
}

export function buildModel(edition: Edition, previous: Edition | null): EditionModel {
  const houses: HouseRow[] = HOUSES.flatMap((house) => {
    const entry = edition.houses.find((h) => h.house === house.id);
    if (!entry) return [];
    const scale = { ...house.scale };
    for (const [k, v] of Object.entries(entry.scaleObserved ?? {})) if (v) scale[k as ScoreKey] = v;
    const age = ageInDays(entry.source.published, edition.cutoff);
    const withAsset = entry.calls.map((call) => ({
      asset: ASSETS.find((a) => a.id === call.asset)!,
      call,
    }));
    return [
      {
        house,
        entry,
        scale,
        ageDays: age,
        stale: age > STALE_AFTER_DAYS,
        leans: withAsset
          .filter((x) => x.call.score !== null && x.call.score > 0)
          .sort((a, b) => b.call.score! - a.call.score!),
        avoids: withAsset
          .filter((x) => x.call.score !== null && x.call.score < 0)
          .sort((a, b) => a.call.score! - b.call.score!),
      },
    ];
  });

  const changes = changesBetween(edition, previous);
  const assets: AssetRow[] = ASSETS.map((asset) => {
    const cells = houses.map((row) => ({
      house: row.house,
      call: row.entry.calls.find((c) => c.asset === asset.id)!,
      change: changes.find((ch) => ch.house === row.house.id && ch.asset === asset.id) ?? null,
    }));
    return { asset, cells, stats: consensusOf(cells.map((c) => c.call.score)) };
  });

  const described = assets.filter((a) => a.stats.verdict.id !== 'insufficient');
  const opposite = (s: ConsensusStats) => Math.min(s.counts.ow, s.counts.uw);
  const strongest =
    [...described]
      .filter((a) => a.stats.mode !== 'n')
      .sort(
        (x, y) =>
          y.stats.agreement! - x.stats.agreement! ||
          opposite(x.stats) - opposite(y.stats) ||
          Math.abs(y.stats.avg!) - Math.abs(x.stats.avg!),
      )[0] ?? null;
  const split =
    [...described].sort(
      (x, y) => x.stats.agreement! - y.stats.agreement! || y.stats.sd! - x.stats.sd!,
    )[0] ?? null;

  return {
    edition,
    previous,
    houses,
    assets,
    changes,
    strongest: strongest && { asset: strongest.asset, stats: strongest.stats },
    split: split && { asset: split.asset, stats: split.stats },
    callCount: assets.reduce((t, a) => t + a.stats.n, 0),
    forecasts: edition.forecasts.map(summarizeForecast),
    themes: [...edition.themes].sort((a, b) => b.houses.length - a.houses.length),
  };
}

export const houseRowById = (m: EditionModel, id: HouseId) =>
  m.houses.find((h) => h.house.id === id);
export const assetRowById = (m: EditionModel, id: AssetId) =>
  m.assets.find((a) => a.asset.id === id);
export const sideOf = (s: Score | null) => (s === null ? 'none' : bucketOf(s));
