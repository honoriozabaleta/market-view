import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dataset } from '../data/load';
import { assets } from '../domain/catalog';
import { compareInstants, InstantSchema, type Dataset } from '../domain/schema';
import {
  availableQuarters,
  changeBetween,
  defaultCohort,
  descriptiveCounts,
  editoriallyEligible,
  eligibleObservations,
  latestObservation,
  publicationUpperBoundForUI,
  quarterOf,
  selectCell,
  selectedStreams,
  snapshotQuery,
  type Query,
} from './selectors-ui';
import {
  ChangeHistory,
  ComparisonMatrix,
  DateLabel,
  EmptyState,
  SourceDetail,
  StanceBadge,
  contextParams,
} from './components';
import { ComparisonFilters, initialFilters, type Filters } from './Filters';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
function getRoute() {
  return window.location.hash.slice(1) || '/latest';
}
const now = __DEMO__ ? dataset.asOf! : new Date().toISOString();

export function App() {
  const route = useSyncExternalStore(subscribe, getRoute);
  const [path, search = ''] = route.split('?');
  const mainRef = useRef<HTMLElement>(null);
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [route]);
  const section = path.split('/')[1];
  return (
    <>
      <a
        className="skip-link"
        tabIndex={0}
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      {__DEMO__ && (
        <div className="demo-banner" role="note">
          Demo data — not actual institutional views{' '}
          <span>
            · Frozen demo clock: <DateLabel value={now} />
          </span>
        </div>
      )}
      <header className="app-header">
        <a href="#/latest" className="brand">
          Market View
        </a>
        <span className="subtle">Independent research coverage</span>
        <nav aria-label="Main navigation">
          {[
            ['latest', 'Latest Views'],
            ['institutions', 'Institutions'],
            ['archive', 'Quarterly Archive'],
            ['methodology', 'Methodology & Sources'],
          ].map(([id, label]) => (
            <a key={id} href={`#/${id}`} aria-current={section === id ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {section === 'latest' ? (
          <Latest />
        ) : section === 'institutions' ? (
          <Institutions id={path.split('/')[2]} />
        ) : section === 'archive' ? (
          <Archive params={new URLSearchParams(search)} />
        ) : ['observations', 'evidence'].includes(section) ? (
          <ObservationDetail
            id={path.split('/')[2]}
            params={new URLSearchParams(search)}
            evidenceOnly={section === 'evidence'}
          />
        ) : section === 'methodology' ? (
          <Methodology />
        ) : (
          <EmptyState title="Page not found">
            Use the navigation to return to covered research.
          </EmptyState>
        )}
      </main>
      <footer>
        Independent personal project · Coverage is curated, not real time · Methodology{' '}
        {dataset.methodologyVersion}. No affiliation with covered institutions. Research comparison
        is not personalized investment advice.
      </footer>
    </>
  );
}
function Comparison({
  data = dataset,
  query,
  snapshotId,
}: {
  data?: Dataset;
  query: Query;
  snapshotId?: string;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const selectedAssets = assets.filter((a) => filters.asset === 'all' || a.id === filters.asset);
  const allCells = selectedStreams(data)
    .filter((s) => filters.stream === 'all' || s.id === filters.stream)
    .flatMap((s) =>
      selectedAssets.map((a) =>
        selectCell(data, s, a.id, query, defaultCohort(a.id, filters.horizon)),
      ),
    );
  const cells = allCells.filter((c) => filters.status === 'all' || c.status === filters.status);
  return (
    <>
      <ComparisonFilters data={data} value={filters} onChange={setFilters} />
      {data.observations.length === 0 ? (
        <EmptyState title="No approved views published">
          Real sources and observations await owner review. No institutional recommendation is
          published. Demo mode is available only through the explicit local demo command.
        </EmptyState>
      ) : cells.length === 0 ? (
        <EmptyState title="No matching views">Adjust or reset the filters.</EmptyState>
      ) : (
        <ComparisonMatrix data={data} cells={cells} query={query} snapshotId={snapshotId} />
      )}
      {allCells.length > 0 && (
        <section className="panel">
          <h2>Descriptive coverage counts</h2>
          <p>
            {filters.horizon}-month allocation stance · Strategic allocation reference · USD. Exact
            catalog universe per asset. Counts use the selected streams before the display-status
            filter; one stream per institution, no duplicate publication votes. These are research
            labels, not portfolio holdings or market consensus. Minimum: 2 comparable streams.
          </p>
          <div className="count-grid">
            {selectedAssets.map((a) => {
              const count = descriptiveCounts(allCells.filter((c) => c.assetId === a.id));
              return (
                <article key={a.id}>
                  <h3>{a.label}</h3>
                  <p className="subtle">
                    {a.geography} · {a.scope} · {a.currency}
                  </p>
                  <p>
                    {count.denominator}/{count.cohortSize} streams comparable
                  </p>
                  {count.sufficient ? (
                    <p>
                      Favorable {count.favorable}/{count.denominator} · Neutral {count.neutral}/
                      {count.denominator} · Unfavorable {count.unfavorable}/{count.denominator}
                    </p>
                  ) : (
                    <p>Insufficient comparable coverage</p>
                  )}
                  <details>
                    <summary>Excluded streams ({count.exclusions.length})</summary>
                    <ul>
                      {count.exclusions.map((c) => (
                        <li key={c.stream.id}>
                          {data.institutions.find((i) => i.id === c.stream.institutionId)?.name}:{' '}
                          {c.reasons.join('; ')}
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
function Latest() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Covered research streams</p>
        <h1>Latest Views</h1>
        <p>
          Latest verified perspective within our coverage. Each team, asset and publication retains
          its own date; this does not describe every view of an institution.
        </p>
        <p className="subtle">
          Coverage cutoff: <DateLabel value={now} /> · {dataset.streams.length} selected streams ·{' '}
          {eligibleObservations(dataset, { cutoff: now, nature: 'recorded' }).length} eligible dated
          observation revisions. Undated and unpublished records are excluded.
        </p>
      </div>
      <Comparison query={{ cutoff: now, nature: 'recorded' }} />
    </>
  );
}
function Institutions({ id }: { id?: string }) {
  const list = dataset.institutions.filter((i) => !id || i.id === id);
  return (
    <>
      <h1>Institutions</h1>
      <p>
        Compare a defined research stream, with its division, team and publication series. An asset
        manager is identified as an asset manager.
      </p>
      {list.length === 0 ? (
        <EmptyState title="No approved institutions in coverage">
          Candidate discovery and source usage assessment remain pending.
        </EmptyState>
      ) : (
        list.map((i) => (
          <article className="panel" key={i.id}>
            <h2>
              <a href={`#/institutions/${i.id}`}>{i.name}</a>
            </h2>
            <p>
              {i.kind.replaceAll('_', ' ')}
              {i.isFictional && ' · Entirely fictional demo identity'}
            </p>
            {dataset.streams
              .filter((s) => s.institutionId === i.id)
              .map((s) => {
                const source = dataset.sources.find((x) => x.id === s.sourceId)!;
                return (
                  <section key={s.id}>
                    <h3>{s.series}</h3>
                    <dl className="facts">
                      <dt>Division</dt>
                      <dd>{s.division}</dd>
                      <dt>Team</dt>
                      <dd>{s.team}</dd>
                      <dt>Comparison stream</dt>
                      <dd>
                        {s.defaultForInstitution
                          ? 'Default for this institution'
                          : 'Detail only; excluded from default counts'}
                      </dd>
                      <dt>Expected cadence</dt>
                      <dd>
                        {s.expectedCadenceDays ? `${s.expectedCadenceDays} days` : 'Not verified'}
                      </dd>
                      <dt>Age policy</dt>
                      <dd>
                        {s.staleAfterDays} days · {s.stalenessBasis}
                      </dd>
                      <dt>Official source</dt>
                      <dd>
                        {source.officialUrl ? (
                          <a href={source.officialUrl} target="_blank" rel="noreferrer noopener">
                            Open official source ↗
                          </a>
                        ) : (
                          'No real source — synthetic fixture'
                        )}
                      </dd>
                      <dt>Usage assessment</dt>
                      <dd>{source.usage.status.replaceAll('_', ' ')}</dd>
                    </dl>
                    <p>
                      {
                        dataset.publications.filter(
                          (p) => p.streamId === s.id && p.firstObservedAt <= now,
                        ).length
                      }{' '}
                      publications in coverage; this is not a completeness claim.
                    </p>
                  </section>
                );
              })}
          </article>
        ))
      )}
    </>
  );
}
function Archive({ params }: { params: URLSearchParams }) {
  const quarters = availableQuarters(dataset, now);
  const active = params.get('cut') || quarters[0]?.id;
  const snapshot = dataset.snapshots.find((s) => s.id === active);
  const quarter = quarters.find((q) => q.id === active);
  const pinned = snapshot ? snapshotQuery(dataset, snapshot.id) : null;
  const query: Query = pinned?.query ?? { cutoff: quarter?.cutoff ?? now, nature: 'recorded' };
  const data = pinned ? { ...dataset, observations: pinned.observations } : dataset;
  return (
    <>
      <h1>Quarterly Archive</h1>
      <p>
        Recorded snapshots reproduce platform availability. Reconstructed snapshots may include
        older documents added later and do not prove past platform coverage.
      </p>
      {!quarters.length ? (
        <EmptyState title="No archived coverage">
          Quarter options will be derived from approved, dated coverage and immutable snapshots.
        </EmptyState>
      ) : (
        <>
          <label className="archive-picker">
            Archive cut
            <select
              value={active}
              onChange={(e) => {
                window.location.hash = `/archive?cut=${encodeURIComponent(e.target.value)}`;
              }}
            >
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} ·{' '}
                  {q.quarterToDate ? 'Quarter to date' : 'Availability at quarter end (computed)'}
                </option>
              ))}
              {dataset.snapshots
                .filter((s) => s.createdAt <= now)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.nature} · revision {s.revision}
                  </option>
                ))}
            </select>
          </label>
          <div className="notice">
            <strong>
              {snapshot
                ? `${snapshot.nature === 'reconstructed' ? 'Reconstructed archive' : 'Recorded snapshot'} · revision ${snapshot.revision}`
                : quarter?.quarterToDate
                  ? 'Quarter to date'
                  : 'Computed historical selection — not a saved snapshot'}
            </strong>
            <p>
              Cutoff: {query.cutoff}
              {snapshot && (
                <>
                  {' '}
                  · Created: {snapshot.createdAt} · Methodology: {snapshot.methodologyVersion} ·{' '}
                  {snapshot.entries.length} pinned observation versions
                </>
              )}
            </p>
            {snapshot?.nature === 'reconstructed' && (
              <p>
                Includes retrospective coverage available by creation time. No post-cutoff
                publications are included.
              </p>
            )}
          </div>
          <Comparison key={active} data={data} query={query} snapshotId={snapshot?.id} />
          <section className="panel">
            <h2>Changes across cuts</h2>
            <p>
              Correction, omission, withdrawal and comparability boundaries are separate from a
              change of allocation stance.
            </p>
            <ChangeHistory
              entries={selectedStreams(dataset)
                .flatMap((s) =>
                  assets.map((a) => {
                    const prior = quarters
                      .filter((q) => q.cutoff < query.cutoff)
                      .sort((a, b) => b.cutoff.localeCompare(a.cutoff))[0];
                    const before = prior
                      ? latestObservation(dataset, s.id, a.id, {
                          cutoff: prior.cutoff,
                          nature: 'recorded',
                        })
                      : null;
                    const current = latestObservation(data, s.id, a.id, query);
                    return {
                      id: `${s.id}-${a.id}`,
                      date: current
                        ? dataset.publications.find((p) => p.id === current.publicationId)!
                            .publishedDate
                        : null,
                      label: `${dataset.institutions.find((i) => i.id === s.institutionId)?.name} · ${a.label}`,
                      change: changeBetween(dataset, before, current),
                    };
                  }),
                )
                .filter((e) => e.date !== null)}
            />
          </section>
        </>
      )}
    </>
  );
}
function ObservationDetail({
  id,
  params,
  evidenceOnly,
}: {
  id?: string;
  params: URLSearchParams;
  evidenceOnly: boolean;
}) {
  const snapshotId = params.get('snapshot') ?? undefined;
  const pinned = snapshotId ? snapshotQuery(dataset, snapshotId) : null;
  const cutoffValue = params.get('cutoff') ?? now;
  const knowledgeValue = params.get('knowledgeAt') ?? cutoffValue;
  const validDates =
    InstantSchema.safeParse(cutoffValue).success &&
    InstantSchema.safeParse(knowledgeValue).success &&
    compareInstants(cutoffValue, now) <= 0 &&
    compareInstants(knowledgeValue, now) <= 0 &&
    (!pinned || compareInstants(pinned.query.knowledgeAt ?? pinned.query.cutoff, now) <= 0);
  const query: Query = pinned?.query ?? {
    cutoff: cutoffValue,
    nature: params.get('nature') === 'reconstructed' ? 'reconstructed' : 'recorded',
    knowledgeAt: knowledgeValue,
  };
  const observation = (pinned?.observations ?? eligibleObservations(dataset, query)).find(
    (o) => o.id === id,
  );
  if (
    !validDates ||
    (snapshotId && !pinned) ||
    !observation ||
    !editoriallyEligible(
      dataset,
      observation,
      query.nature === 'recorded' ? query.cutoff : query.knowledgeAt!,
    )
  )
    return (
      <EmptyState title="Observation unavailable at this cut">
        This link does not identify an eligible observation in the selected temporal coverage.
      </EmptyState>
    );
  const p = dataset.publications.find((p) => p.id === observation.publicationId)!;
  const stream = dataset.streams.find((s) => s.id === p.streamId)!;
  const institution = dataset.institutions.find((i) => i.id === stream.institutionId)!;
  const detailData = pinned ? { ...dataset, observations: pinned.observations } : dataset;
  const cell = selectCell(detailData, stream, observation.assetId, query);
  const mapping = dataset.mappings.find((m) => m.id === observation.mappingRuleId);
  const review = dataset.reviews.find((r) => r.observationId === observation.id)!;
  const history = eligibleObservations(detailData, query)
    .filter(
      (o) =>
        o.assetId === observation.assetId &&
        dataset.publications.find((p) => p.id === o.publicationId)?.streamId === stream.id,
    )
    .sort(
      (a, b) =>
        publicationUpperBoundForUI(dataset, a).localeCompare(
          publicationUpperBoundForUI(dataset, b),
        ) || a.verifiedAt.localeCompare(b.verifiedAt),
    );
  return (
    <>
      <a
        href={
          snapshotId || query.cutoff !== now
            ? `#/archive?cut=${snapshotId ?? quarterOf(query.cutoff)}`
            : '#/latest'
        }
      >
        ← Back to comparison
      </a>
      <h1>{assets.find((a) => a.id === observation.assetId)?.label}</h1>
      <p>
        {institution.name} · {stream.team} · {stream.series}
      </p>
      <p className="subtle">
        Selected observation: {observation.id} · Cutoff {query.cutoff} · {query.nature}
      </p>
      {evidenceOnly ? (
        <SourceDetail
          data={dataset}
          observation={observation}
          knowledgeAt={query.nature === 'recorded' ? query.cutoff : query.knowledgeAt!}
        />
      ) : (
        <>
          <section className="panel">
            <h2>Source statement</h2>
            <p>
              <strong>Original stance:</strong> {observation.originalStance ?? 'Not disclosed'} ·{' '}
              {observation.viewType}
            </p>
            <p>
              <StanceBadge
                status={
                  cell.observation?.id === observation.id
                    ? cell.status
                    : (observation.normalizedStance ?? 'not-comparable')
                }
              />
            </p>
            <dl className="facts">
              <dt>Original asset / universe</dt>
              <dd>
                {observation.originalAsset} · {observation.originalUniverse}
              </dd>
              <dt>Normalized universe</dt>
              <dd>
                {observation.universe.geography} · {observation.universe.scope} ·{' '}
                {observation.universe.currency ?? 'Unknown currency'}
              </dd>
              <dt>Horizon</dt>
              <dd>
                {observation.horizon.original ?? 'Not disclosed'}
                {observation.horizon.months && ` (${observation.horizon.months} months)`}
              </dd>
              <dt>Reference</dt>
              <dd>{observation.benchmark ?? 'Not disclosed'}</dd>
              <dt>Currency</dt>
              <dd>{observation.currency ?? 'Not disclosed'}</dd>
              {observation.forecast && (
                <>
                  <dt>Quantitative forecast</dt>
                  <dd>
                    {observation.forecast.value} {observation.forecast.unit}
                  </dd>
                </>
              )}
              <dt>Published by source</dt>
              <dd>
                <DateLabel value={p.publishedDate} precision={p.datePrecision} />
              </dd>
              <dt>First observed</dt>
              <dd>
                <DateLabel value={p.firstObservedAt} />
              </dd>
              <dt>Observation verified</dt>
              <dd>
                <DateLabel value={observation.verifiedAt} />
              </dd>
              <dt>Editorial review</dt>
              <dd>
                {review.status} · {review.reviewer ?? 'No human reviewer claimed'} ·{' '}
                <DateLabel value={review.at} />
              </dd>
              <dt>First published in Market View</dt>
              <dd>
                <DateLabel value={observation.firstPublishedAt} />
              </dd>
            </dl>
            <h3>Thesis</h3>
            <p>{observation.thesis.text}</p>
            <p className="subtle">
              Evidence: {observation.thesis.evidence.citation} ·{' '}
              {observation.thesis.evidence.locator}
            </p>
            <h3>Risks</h3>
            <ul>
              {observation.risks.map((r, i) => (
                <li key={i}>
                  {r.text}
                  <span className="subtle block">
                    Evidence: {r.evidence.citation} · {r.evidence.locator}
                  </span>
                </li>
              ))}
            </ul>
            <a
              className="button-link"
              href={`#/evidence/${observation.id}?${contextParams(query, snapshotId)}`}
            >
              View evidence
            </a>
          </section>
          <section className="panel">
            <h2>Market View interpretation</h2>
            <p>
              This normalization is an editorial classification, separate from the original
              statement.
            </p>
            <p>
              {mapping
                ? `${mapping.originalLabel} → ${mapping.normalized}. ${mapping.rationale}`
                : 'No approved context-specific mapping. This observation does not feed a normalized allocation classification.'}
            </p>
            {observation.editorialInterpretation && (
              <p>
                {observation.editorialInterpretation.text} · Evidence:{' '}
                {observation.editorialInterpretation.evidence.citation} ·{' '}
                {observation.editorialInterpretation.evidence.locator}
              </p>
            )}
            <p>
              {cell.notRenewed && 'Not renewed in a later partial publication. '}
              {cell.reasons.join('; ')}
            </p>
            <p>
              Age policy: {stream.staleAfterDays} days from source publication, not from
              verification. {stream.stalenessBasis}.
            </p>
          </section>
          <SourceDetail
            data={dataset}
            observation={observation}
            knowledgeAt={query.nature === 'recorded' ? query.cutoff : query.knowledgeAt!}
          />
          <section className="panel">
            <h2>Observation history within this cut</h2>
            <ChangeHistory
              entries={history.map((o, i) => ({
                id: o.id,
                date: dataset.publications.find((p) => p.id === o.publicationId)!.publishedDate,
                label: `${o.originalStance ?? 'No stance'} · ${o.revisionKind.replaceAll('_', ' ')}`,
                change: changeBetween(dataset, history[i - 1] ?? null, o),
              }))}
            />
          </section>
        </>
      )}
    </>
  );
}
function Methodology() {
  return (
    <>
      <h1>Methodology & Sources</h1>
      <div className="prose">
        <p>
          Market View compares published research streams within a curated coverage set. “Latest”
          means the latest dated, verified and eligible observation in that coverage. It does not
          mean the latest opinion of an entire institution or real-time monitoring.
        </p>
        <section className="panel">
          <h2>Comparison contract</h2>
          <p>
            The matrix prioritizes explicit allocation stance. Favorable, neutral and unfavorable
            require a documented mapping for the source, label, universe, horizon and reference.
            Bullish, attractive, a price target or a Fed forecast does not automatically become an
            allocation recommendation.
          </p>
          <p>
            The initial cohort requires an exact catalog universe, USD currency, a Strategic
            allocation reference and a selected 12- or 3-month horizon. Unknown horizons and
            different universes are excluded. Not disclosed, not comparable, stale and withdrawn are
            distinct from neutral. Narrative and quantitative observations remain available as
            evidence.
          </p>
          <p>
            Counts are descriptive labels from one default stream per institution. At least two
            comparable streams are required. No sentiment score, performance ranking or numerical
            consensus index is produced.
          </p>
        </section>
        <section className="panel">
          <h2>Time & revisions</h2>
          <p>
            Publication, first observation, verification, editorial approval and first platform
            release are separate dates. Missing publication dates are not ranked as latest.
            Month-only dates enter historical selection only after that month ends. Rechecking a
            website does not renew an old recommendation.
          </p>
          <p>
            A later partial publication does not refresh omitted assets. An explicit withdrawal
            removes the active stance. Historical recorded queries require all availability dates at
            or before the cutoff. Reconstructed archives may use older documents added later; the
            label and creation date make that limit visible.
          </p>
          <p>
            Closed snapshot entries pin observation IDs and publication versions. Corrections append
            identified revisions and never silently overwrite the archive. Extraction corrections
            are separate from institutional view changes. A change of methodology, type, horizon,
            universe or reference limits comparison.
          </p>
        </section>
        <section className="panel">
          <h2>Coverage & source usage</h2>
          <p>
            {__DEMO__
              ? 'All institutions, research statements and evidence in this demo are authored fictional fixtures. Review dates simulate a lifecycle and do not represent human review.'
              : 'No real institutional views have been approved for publication. Real-source discovery remains in a separate, unpublished candidate registry.'}
          </p>
          <p>
            Public sources require a human usage assessment: pending review, link only, approved
            scope or excluded. Link-only status does not permit analytical observations.
            Bibliographic evidence can be sufficient; original reports, screenshots and full text
            are not hosted. No third-party logos are used.
          </p>
          <p>
            Source metadata and observations require owner review before promotion to published
            data. Public accessibility and attribution do not establish permission to reuse source
            material.
          </p>
        </section>
        <section className="panel">
          <h2>Limitations</h2>
          <p>
            Coverage is deliberately small and may omit publications, assets or teams. An absent
            record is not a neutral view. Research labels do not establish actual portfolio
            positions, investment suitability or market-wide agreement. There are no user accounts,
            payments, automated scraping, LLM extraction, trading or backtests in this version.
          </p>
        </section>
      </div>
    </>
  );
}
