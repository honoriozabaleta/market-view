import { assets } from '../domain/catalog';
import type { Dataset } from '../domain/schema';
import {
  defaultCohort,
  descriptiveCounts,
  selectCell,
  selectedStreams,
  type Cell,
  type Query,
} from './selectors-ui';
import { CountBar, EmptyState, StatusKey, label } from './components';
import { ComparisonFilters, initialFilters, type Filters } from './Filters';
import { ComparisonMatrix, type Coverage } from './Matrix';

export function Comparison({
  data,
  query,
  snapshotId,
  filters,
  onFiltersChange,
}: {
  data: Dataset;
  query: Query;
  snapshotId?: string;
  filters: Filters;
  onFiltersChange: (value: Filters) => void;
}) {
  if (data.observations.length === 0)
    return (
      <EmptyState title="No approved views published">
        Real sources and observations await owner review. No institutional recommendation is
        published. Demo mode is available only through the explicit local demo command.
      </EmptyState>
    );
  const selectedAssets = assets.filter((a) => filters.asset === 'all' || a.id === filters.asset);
  const streams = selectedStreams(data).filter(
    (s) => filters.stream === 'all' || s.id === filters.stream,
  );
  const allCells = streams.flatMap((s) =>
    selectedAssets.map((a) =>
      selectCell(data, s, a.id, query, defaultCohort(a.id, filters.horizon)),
    ),
  );
  const cells = allCells.filter((c) => filters.status === 'all' || c.status === filters.status);
  // Counts use the selected streams before the display-status filter.
  const counts = selectedAssets.map((a) => ({
    asset: a,
    count: descriptiveCounts(allCells.filter((c) => c.assetId === a.id)),
  }));
  const coverage: Coverage = Object.fromEntries(counts.map((c) => [c.asset.id, c.count]));
  const shownStreams = new Set(cells.map((c) => c.stream.id)).size;
  const shownAssets = new Set(cells.map((c) => c.assetId)).size;
  return (
    <>
      <ComparisonFilters data={data} value={filters} onChange={onFiltersChange} />
      <div className="matrix-context">
        <p>
          <strong>Cohort:</strong> {filters.horizon}-month allocation stance · Strategic allocation
          reference · USD · exact catalog universe per asset · one default stream per institution.
        </p>
        <p className="result-count" aria-live="polite">
          {cells.length === 0
            ? 'No cells match the current filters.'
            : `Showing ${shownStreams} ${shownStreams === 1 ? 'stream' : 'streams'} × ${shownAssets} ${shownAssets === 1 ? 'asset' : 'assets'}.`}
        </p>
        <details className="key-toggle">
          <summary>Status key</summary>
          <StatusKey />
          <p>
            <a href="#/methodology/comparison">Read the comparison rules</a>
          </p>
        </details>
      </div>
      {cells.length === 0 ? (
        <EmptyState
          title="No matching views"
          action={
            <button
              type="button"
              className="button-quiet"
              onClick={() => onFiltersChange(initialFilters)}
            >
              Clear all filters
            </button>
          }
        >
          No research stream has this status for the selected assets and horizon. Statuses are never
          inferred to fill the matrix.
        </EmptyState>
      ) : (
        <ComparisonMatrix
          data={data}
          cells={cells}
          query={query}
          snapshotId={snapshotId}
          coverage={coverage}
          horizonMonths={filters.horizon}
        />
      )}
      {allCells.length > 0 && <CoverageCounts data={data} counts={counts} filters={filters} />}
    </>
  );
}

function CoverageCounts({
  data,
  counts,
  filters,
}: {
  data: Dataset;
  counts: { asset: (typeof assets)[number]; count: ReturnType<typeof descriptiveCounts> }[];
  filters: Filters;
}) {
  const name = (c: Cell) =>
    data.institutions.find((i) => i.id === c.stream.institutionId)?.name ?? c.stream.id;
  return (
    <section className="section" aria-labelledby="coverage-heading">
      <div className="section-head">
        <h2 id="coverage-heading">Views in our coverage</h2>
        <p className="section-note">
          Descriptive counts of published research labels in the {filters.horizon}-month cohort —
          not market consensus, portfolio holdings or a score. They use the selected streams before
          the display-status filter, one stream per institution, with no duplicate publication
          votes. Minimum: 2 comparable streams.
        </p>
      </div>
      <div className="table-frame">
        <table className="counts stack-table">
          <thead>
            <tr>
              <th scope="col">Asset</th>
              <th scope="col">Distribution</th>
              <th scope="col">Comparable</th>
              <th scope="col">Favorable</th>
              <th scope="col">Neutral</th>
              <th scope="col">Unfavorable</th>
              <th scope="col">Not compared</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ asset, count }) => (
              <tr key={asset.id} data-sufficient={count.sufficient}>
                <th scope="row">
                  {asset.label}
                  <span className="row-meta">
                    {asset.geography} · {label(asset.scope)} · {asset.currency}
                  </span>
                </th>
                <td data-label="Distribution" className="counts-bar">
                  <CountBar count={count} />
                </td>
                <td data-label="Comparable" className="num">
                  {count.denominator} of {count.cohortSize} streams
                </td>
                {count.sufficient ? (
                  <>
                    <td data-label="Favorable" className="num">
                      {count.favorable}/{count.denominator}
                    </td>
                    <td data-label="Neutral" className="num">
                      {count.neutral}/{count.denominator}
                    </td>
                    <td data-label="Unfavorable" className="num">
                      {count.unfavorable}/{count.denominator}
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="insufficient" data-label="Distribution">
                    Insufficient comparable coverage
                  </td>
                )}
                <td data-label="Not compared">
                  {count.exclusions.length === 0 ? (
                    <span className="subtle">None</span>
                  ) : (
                    <details className="reasons">
                      <summary>
                        {count.exclusions.length}{' '}
                        {count.exclusions.length === 1 ? 'stream' : 'streams'}
                      </summary>
                      <ul>
                        {count.exclusions.map((c) => (
                          <li key={c.stream.id}>
                            <strong>{name(c)}:</strong> {c.reasons.join('; ')}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
