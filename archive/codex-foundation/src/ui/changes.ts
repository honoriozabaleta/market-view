import { dataset } from '../data/load';
import { assets } from '../domain/catalog';
import type { Dataset } from '../domain/schema';
import {
  availableQuarters,
  changeBetween,
  latestObservation,
  selectedStreams,
  type Query,
} from './selectors-ui';
import { now } from './clock';

/**
 * Presentation wiring only: pairs each default stream/asset at `query` with its latest recorded
 * observation at the previous quarter cut and lets `changeBetween` classify the difference.
 */
export function changesSincePriorQuarter(data: Dataset, query: Query) {
  const prior = availableQuarters(dataset, now)
    .filter((q) => q.cutoff < query.cutoff)
    .sort((a, b) => b.cutoff.localeCompare(a.cutoff))[0];
  const entries = selectedStreams(dataset)
    .flatMap((s) =>
      assets.map((a) => {
        const before = prior
          ? latestObservation(dataset, s.id, a.id, { cutoff: prior.cutoff, nature: 'recorded' })
          : null;
        const current = latestObservation(data, s.id, a.id, query);
        return {
          id: `${s.id}-${a.id}`,
          streamId: s.id,
          assetId: a.id,
          hasPrior: !!before,
          sameObservation: !!before && !!current && before.id === current.id,
          date: current
            ? dataset.publications.find((p) => p.id === current.publicationId)!.publishedDate
            : null,
          label: `${dataset.institutions.find((i) => i.id === s.institutionId)?.name} · ${a.label}`,
          change: changeBetween(dataset, before, current),
        };
      }),
    )
    .filter((e) => e.date !== null);
  return { prior, entries };
}
