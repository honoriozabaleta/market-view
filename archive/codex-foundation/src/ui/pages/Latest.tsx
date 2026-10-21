import { dataset } from '../../data/load';
import { eligibleObservations, type Query } from '../selectors-ui';
import { ChangeHistory, DateLabel, InstantLabel, PageHead } from '../components';
import { Comparison } from '../Comparison';
import type { Filters } from '../Filters';
import { changesSincePriorQuarter } from '../changes';
import { now } from '../clock';

function CoverageStrip({ query }: { query: Query }) {
  return (
    <>
      <dl className="kpis">
        <div>
          <dt>Coverage cutoff</dt>
          <dd>
            <DateLabel value={now} />
          </dd>
        </div>
        <div>
          <dt>Research streams</dt>
          <dd>
            {dataset.streams.length} <span className="kpi-unit">selected</span>
          </dd>
        </div>
        <div>
          <dt>Eligible revisions</dt>
          <dd>
            {eligibleObservations(dataset, query).length} <span className="kpi-unit">dated</span>
          </dd>
        </div>
        <div>
          <dt>Methodology</dt>
          <dd>
            <a href="#/methodology">v{dataset.methodologyVersion}</a>
          </dd>
        </div>
      </dl>
      <p className="subtle">Undated and unpublished records are excluded from every count.</p>
    </>
  );
}

export function Latest({
  filters,
  onFiltersChange,
}: {
  filters: Filters;
  onFiltersChange: (value: Filters) => void;
}) {
  const query: Query = { cutoff: now, nature: 'recorded' };
  const { prior, entries } = changesSincePriorQuarter(dataset, query);
  const recent = entries.filter(
    (e) =>
      !e.sameObservation &&
      (filters.asset === 'all' || e.assetId === filters.asset) &&
      (filters.stream === 'all' || e.streamId === filters.stream),
  );
  // Grouped by whether an earlier observation exists; the change labels come from changeBetween.
  const revised = recent.filter((e) => e.hasPrior);
  const firstCovered = recent.filter((e) => !e.hasPrior);
  return (
    <>
      <PageHead
        kicker="Covered research streams"
        title="Latest Views"
        aside={<CoverageStrip query={query} />}
      >
        <p className="lead">
          Latest verified perspective within our coverage. Each team, asset and publication keeps
          its own date; this does not describe every view of an institution.
        </p>
      </PageHead>
      <Comparison
        data={dataset}
        query={query}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
      {dataset.observations.length > 0 && (
        <section className="section" aria-labelledby="recent-heading">
          <div className="section-head">
            <h2 id="recent-heading">
              {prior ? `What changed since the ${prior.id} cut` : 'Observations in coverage'}
            </h2>
            <p className="section-note">
              {prior ? (
                <>
                  Compared with the latest recorded observation at{' '}
                  <InstantLabel value={prior.cutoff} />. Views carried forward unchanged are omitted
                  here.
                </>
              ) : (
                'No earlier quarter in coverage.'
              )}{' '}
              Corrections, withdrawals and comparison boundaries are labeled separately from a
              change of allocation stance. Asset and stream filters apply.
            </p>
          </div>
          {recent.length === 0 ? (
            <p className="subtle">
              No new or revised observations for the selected assets and streams.
            </p>
          ) : (
            <>
              {revised.length > 0 ? (
                <ChangeHistory entries={revised} />
              ) : (
                <p className="subtle">
                  No stream revisited an asset it already covered at the earlier cut.
                </p>
              )}
              {firstCovered.length > 0 && (
                <details className="publications first-covered">
                  <summary>
                    First covered since the earlier cut ({firstCovered.length}) — no earlier
                    observation to compare
                  </summary>
                  <ChangeHistory entries={firstCovered} />
                </details>
              )}
            </>
          )}
          <p className="section-link">
            <a href="#/archive">Compare cuts in the archive →</a>
          </p>
        </section>
      )}
    </>
  );
}
