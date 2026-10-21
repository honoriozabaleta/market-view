import { assets } from './catalog';
import {
  compareInstants,
  publicationUpperBound,
  type Dataset,
  type Observation,
  type ResearchStream,
  type AssetId,
  type Stance,
} from './schema';

export type Query = { cutoff: string; nature: 'recorded' | 'reconstructed'; knowledgeAt?: string };
export type Cohort = {
  viewType: 'allocation';
  horizonMonths: number;
  benchmark: string;
  scope: string;
  geography: string;
  currency: string;
};
export type Cell = {
  stream: ResearchStream;
  assetId: AssetId;
  observation: Observation | null;
  status: Stance | 'not-disclosed' | 'not-comparable' | 'stale' | 'withdrawn';
  reasons: string[];
  notRenewed: boolean;
};

export function defaultCohort(assetId: AssetId, horizonMonths = 12): Cohort {
  const asset = assets.find((x) => x.id === assetId)!;
  return {
    viewType: 'allocation',
    horizonMonths,
    benchmark: 'Strategic allocation',
    scope: asset.scope,
    geography: asset.geography,
    currency: asset.currency,
  };
}
export function editoriallyEligible(data: Dataset, o: Observation, knowledgeAt: string): boolean {
  const p = data.publications.find((x) => x.id === o.publicationId)!;
  const review = data.reviews.find((x) => x.observationId === o.id);
  const stream = data.streams.find((x) => x.id === p.streamId)!;
  const source = data.sources.find((x) => x.id === stream.sourceId)!;
  const release = o.firstPublishedAt;
  if (
    !release ||
    compareInstants(release, knowledgeAt) > 0 ||
    !p.marketViewPublishedAt ||
    compareInstants(p.marketViewPublishedAt, knowledgeAt) > 0 ||
    compareInstants(o.verifiedAt, knowledgeAt) > 0 ||
    compareInstants(p.firstObservedAt, knowledgeAt) > 0
  )
    return false;
  if (data.mode === 'demo')
    return (
      p.editorialState === 'demo' &&
      review?.status === 'demo' &&
      !!review.at &&
      compareInstants(review.at, knowledgeAt) <= 0
    );
  return (
    p.editorialState === 'published' &&
    review?.status === 'approved' &&
    !!review.reviewer &&
    !!review.at &&
    compareInstants(review.at, knowledgeAt) <= 0 &&
    source.usage.status === 'approved_scope' &&
    !!source.usage.scope &&
    !!source.usage.reviewedAt &&
    compareInstants(source.usage.reviewedAt, knowledgeAt) <= 0 &&
    !!source.verifiedAt &&
    compareInstants(source.verifiedAt, knowledgeAt) <= 0
  );
}
export function eligibleObservations(data: Dataset, query: Query): Observation[] {
  const knowledgeAt =
    query.nature === 'recorded' ? query.cutoff : (query.knowledgeAt ?? query.cutoff);
  return data.observations.filter((o) => {
    const p = data.publications.find((x) => x.id === o.publicationId)!;
    return (
      p.publishedDate !== null &&
      compareInstants(publicationUpperBound(p), query.cutoff) <= 0 &&
      editoriallyEligible(data, o, knowledgeAt)
    );
  });
}
export function selectedStreams(data: Dataset): ResearchStream[] {
  return data.streams.filter((s) => s.defaultForInstitution);
}
export function comparisonExclusions(o: Observation, cohort: Cohort): string[] {
  const reasons: string[] = [];
  if (o.viewType !== cohort.viewType) reasons.push(`View type: ${o.viewType}`);
  if (o.normalizedStance === null) reasons.push('No documented allocation mapping');
  if (o.horizon.months === null) reasons.push('Horizon not disclosed');
  else if (o.horizon.months !== cohort.horizonMonths)
    reasons.push(`Horizon: ${o.horizon.months} months`);
  if (o.benchmark !== cohort.benchmark) reasons.push('Different or unknown benchmark');
  if (o.universe.scope !== cohort.scope || o.universe.geography !== cohort.geography)
    reasons.push('Different universe or geography');
  if (o.currency !== cohort.currency || o.universe.currency !== cohort.currency)
    reasons.push('Different or unknown currency');
  return reasons;
}
export function latestObservation(
  data: Dataset,
  streamId: string,
  assetId: AssetId,
  query: Query,
): Observation | null {
  const candidates = eligibleObservations(data, query).filter(
    (o) =>
      o.assetId === assetId &&
      data.publications.find((p) => p.id === o.publicationId)?.streamId === streamId,
  );
  // Remove only explicit replacements available under this exact temporal query.
  const replaced = new Set(candidates.map((o) => o.replacesObservationId).filter(Boolean));
  const versioned = new Set(
    data.publications
      .filter((p) => candidates.some((o) => o.publicationId === p.id))
      .map((p) => p.supersedesPublicationId)
      .filter(Boolean),
  );
  return (
    candidates
      .filter((o) => !replaced.has(o.id) && !versioned.has(o.publicationId))
      .sort((a, b) => {
        const pa = data.publications.find((x) => x.id === a.publicationId)!;
        const pb = data.publications.find((x) => x.id === b.publicationId)!;
        return (
          compareInstants(publicationUpperBound(pb), publicationUpperBound(pa)) ||
          compareInstants(b.verifiedAt, a.verifiedAt) ||
          a.id.localeCompare(b.id)
        );
      })[0] ?? null
  );
}
export function selectCell(
  data: Dataset,
  stream: ResearchStream,
  assetId: AssetId,
  query: Query,
  cohort = defaultCohort(assetId),
): Cell {
  const observation = latestObservation(data, stream.id, assetId, query);
  if (!observation)
    return {
      stream,
      assetId,
      observation,
      status: 'not-disclosed',
      reasons: ['No dated, eligible explicit observation in coverage'],
      notRenewed: false,
    };
  const p = data.publications.find((x) => x.id === observation.publicationId)!;
  const knowledgeAt =
    query.nature === 'recorded' ? query.cutoff : (query.knowledgeAt ?? query.cutoff);
  const latestPublication = data.publications
    .filter(
      (x) =>
        x.streamId === stream.id &&
        x.publishedDate &&
        compareInstants(publicationUpperBound(x), query.cutoff) <= 0 &&
        compareInstants(x.firstObservedAt, knowledgeAt) <= 0 &&
        !!x.marketViewPublishedAt &&
        compareInstants(x.marketViewPublishedAt, knowledgeAt) <= 0 &&
        x.editorialState === (data.mode === 'demo' ? 'demo' : 'published'),
    )
    .sort((a, b) => compareInstants(publicationUpperBound(b), publicationUpperBound(a)))[0];
  const notRenewed =
    !!latestPublication &&
    compareInstants(publicationUpperBound(latestPublication), publicationUpperBound(p)) > 0;
  const reasons = comparisonExclusions(observation, cohort);
  const ageDays = (Date.parse(query.cutoff) - Date.parse(publicationUpperBound(p))) / 86400000;
  let status: Cell['status'] = observation.normalizedStance ?? 'not-comparable';
  if (reasons.length) status = 'not-comparable';
  if (ageDays > stream.staleAfterDays) {
    status = 'stale';
    reasons.unshift(`Older than ${stream.staleAfterDays} days; ${stream.stalenessBasis}`);
  }
  if (observation.status === 'withdrawn') {
    status = 'withdrawn';
    reasons.unshift('Explicit withdrawal; prior view is not carried forward');
  }
  return { stream, assetId, observation, status, reasons, notRenewed };
}
export function descriptiveCounts(cells: Cell[]) {
  const comparable = cells.filter((c) =>
    ['favorable', 'neutral', 'unfavorable'].includes(c.status),
  );
  return {
    denominator: comparable.length,
    cohortSize: cells.length,
    sufficient: comparable.length >= 2,
    favorable: comparable.filter((c) => c.status === 'favorable').length,
    neutral: comparable.filter((c) => c.status === 'neutral').length,
    unfavorable: comparable.filter((c) => c.status === 'unfavorable').length,
    exclusions: cells.filter((c) => !comparable.includes(c)),
  };
}
export function changeBetween(
  data: Dataset,
  previous: Observation | null,
  current: Observation | null,
): string {
  if (!current) return 'No eligible observation';
  if (!previous) return 'First covered observation';
  if (previous.id === current.id) return 'Not renewed';
  const previousStream = data.publications.find((p) => p.id === previous.publicationId)?.streamId;
  const currentStream = data.publications.find((p) => p.id === current.publicationId)?.streamId;
  if (previous.assetId !== current.assetId || !previousStream || previousStream !== currentStream)
    return 'Comparison boundary — asset or research stream differs';
  if (current.revisionKind === 'extraction_correction')
    return 'Extraction correction — not an institutional view change';
  if (current.status === 'withdrawn') return 'Explicit withdrawal';
  if (
    previous.viewType !== current.viewType ||
    previous.horizon.months === null ||
    current.horizon.months === null ||
    previous.horizon.months !== current.horizon.months ||
    previous.benchmark !== current.benchmark ||
    previous.currency !== current.currency ||
    previous.universe.scope !== current.universe.scope ||
    previous.universe.geography !== current.universe.geography ||
    previous.universe.currency !== current.universe.currency ||
    previous.normalizedStance === null ||
    current.normalizedStance === null
  )
    return 'Comparison boundary — type, horizon, universe or reference differs';
  return previous.normalizedStance === current.normalizedStance
    ? 'Reaffirmed explicit view'
    : `View changed: ${previous.normalizedStance} → ${current.normalizedStance}`;
}
export function quarterOf(date: string): string {
  return `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}`;
}
export function availableQuarters(
  data: Dataset,
  now: string,
): { id: string; cutoff: string; quarterToDate: boolean }[] {
  const dates = [
    ...eligibleObservations(data, { cutoff: now, nature: 'recorded' }).map(
      (o) => data.publications.find((p) => p.id === o.publicationId)!.publishedDate!,
    ),
    ...data.snapshots.filter((s) => compareInstants(s.createdAt, now) <= 0).map((s) => s.cutoff),
  ];
  return [...new Set(dates.map(quarterOf))]
    .sort()
    .reverse()
    .map((id) => {
      const year = Number(id.slice(0, 4));
      const q = Number(id.slice(-1));
      const end = new Date(Date.UTC(year, q * 3, 0, 23, 59, 59))
        .toISOString()
        .replace('.000Z', 'Z');
      return {
        id,
        cutoff: compareInstants(end, now) > 0 ? now : end,
        quarterToDate: compareInstants(end, now) > 0,
      };
    });
}
export function snapshotQuery(
  data: Dataset,
  id: string,
): { query: Query; observations: Observation[] } | null {
  const snapshot = data.snapshots.find((s) => s.id === id);
  if (!snapshot) return null;
  return {
    query: { cutoff: snapshot.cutoff, nature: snapshot.nature, knowledgeAt: snapshot.createdAt },
    observations: snapshot.entries.map((e) =>
      data.observations.find((o) => o.id === e.observationId)!,
    ),
  };
}
