import { dataset } from '../../data/load';
import { compareInstants } from '../../domain/schema';
import { availableQuarters, quarterOf, snapshotQuery, type Query } from '../selectors-ui';
import { ChangeHistory, DateLabel, EmptyState, InstantLabel, PageHead } from '../components';
import { Comparison } from '../Comparison';
import type { Filters } from '../Filters';
import { changesSincePriorQuarter } from '../changes';
import { now } from '../clock';

function CutLink({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      className="cut-link"
      href={`#/archive?cut=${encodeURIComponent(id)}`}
      aria-current={active ? 'true' : undefined}
    >
      <span>
        {children}
        {active && <span className="cut-selected"> · Selected</span>}
      </span>
    </a>
  );
}

export function Archive({
  params,
  filters,
  onFiltersChange,
}: {
  params: URLSearchParams;
  filters: Filters;
  onFiltersChange: (value: Filters) => void;
}) {
  const quarters = availableQuarters(dataset, now);
  const active = params.get('cut') || quarters[0]?.id;
  const savedSnapshots = dataset.snapshots.filter((s) => compareInstants(s.createdAt, now) <= 0);
  const snapshot = savedSnapshots.find((s) => s.id === active);
  const quarter = quarters.find((q) => q.id === active);
  const pinned = snapshot ? snapshotQuery(dataset, snapshot.id) : null;
  const query: Query = pinned?.query ?? { cutoff: quarter?.cutoff ?? now, nature: 'recorded' };
  const data = pinned ? { ...dataset, observations: pinned.observations } : dataset;
  const kind = snapshot
    ? snapshot.nature
    : quarter?.quarterToDate
      ? 'to-date'
      : quarter
        ? 'computed'
        : 'unknown';
  const { prior, entries } = changesSincePriorQuarter(data, query);
  const changes = entries.filter(
    (e) =>
      (filters.asset === 'all' || e.assetId === filters.asset) &&
      (filters.stream === 'all' || e.streamId === filters.stream),
  );
  return (
    <>
      <PageHead kicker="Point-in-time comparison" title="Quarterly Archive">
        <p className="lead">
          Recorded snapshots reproduce platform availability. Reconstructed snapshots may include
          older documents added later and do not prove past platform coverage.{' '}
          <a href="#/methodology/time">How archive cuts work</a>
        </p>
      </PageHead>
      {!quarters.length ? (
        <EmptyState title="No archived coverage">
          Quarter options will be derived from approved, dated coverage and immutable snapshots.
        </EmptyState>
      ) : (
        <>
          <div className="archive-bar">
            <div className="filter-field archive-picker">
              <label htmlFor="archive-cut">Archive cut</label>
              <select
                id="archive-cut"
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
                {savedSnapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.nature} · revision {s.revision}
                  </option>
                ))}
              </select>
            </div>
            <div className={`cut-summary cut-${kind}`}>
              <p className="kicker">Selected cut</p>
              <strong className="cut-title">
                {snapshot
                  ? `${snapshot.nature === 'reconstructed' ? 'Reconstructed archive' : 'Recorded snapshot'} · revision ${snapshot.revision}`
                  : quarter?.quarterToDate
                    ? 'Quarter to date'
                    : quarter
                      ? 'Computed historical selection — not a saved snapshot'
                      : 'Unknown archive cut'}
              </strong>
              <dl className="kv-inline">
                <div>
                  <dt>Cutoff</dt>
                  <dd>
                    <InstantLabel value={query.cutoff} />
                  </dd>
                </div>
                {snapshot && (
                  <>
                    <div>
                      <dt>Created</dt>
                      <dd>
                        <InstantLabel value={snapshot.createdAt} />
                      </dd>
                    </div>
                    <div>
                      <dt>Methodology</dt>
                      <dd>{snapshot.methodologyVersion}</dd>
                    </div>
                    <div>
                      <dt>Pinned</dt>
                      <dd>{snapshot.entries.length} observation versions</dd>
                    </div>
                  </>
                )}
              </dl>
              {snapshot?.nature === 'reconstructed' && (
                <p>
                  Includes retrospective coverage available by creation time. No post-cutoff
                  publications are included.
                </p>
              )}
              {snapshot?.nature === 'recorded' && (
                <p>Captured at its cutoff; reflects what the platform had available then.</p>
              )}
              {kind === 'to-date' && (
                <p>Open quarter, capped at the current query clock — never a future quarter end.</p>
              )}
              {kind === 'computed' && (
                <p>
                  Computed now from records whose publication and availability dates fall on or
                  before the cutoff. It is not an immutable saved snapshot.
                </p>
              )}
              {kind === 'unknown' && (
                <p>This link does not identify a quarter or a saved snapshot. Choose a cut.</p>
              )}
            </div>
          </div>
          <section className="section cuts-section" aria-labelledby="cuts-heading">
            <div className="section-head">
              <h2 id="cuts-heading">Available cuts</h2>
              <p className="section-note">
                Each quarter can have a computed selection and, separately, saved snapshots. Missing
                snapshots are shown as missing; no continuity is implied between cuts.
              </p>
            </div>
            <div className="table-frame">
              <table className="cuts stack-table">
                <thead>
                  <tr>
                    <th scope="col">Quarter</th>
                    <th scope="col">Computed selection</th>
                    <th scope="col">Recorded snapshots</th>
                    <th scope="col">Reconstructed snapshots</th>
                  </tr>
                </thead>
                <tbody>
                  {quarters.map((q) => {
                    const inQuarter = savedSnapshots.filter((s) => quarterOf(s.cutoff) === q.id);
                    return (
                      <tr key={q.id}>
                        <th scope="row">{q.id}</th>
                        <td data-label="Computed selection">
                          <CutLink id={q.id} active={active === q.id}>
                            {q.quarterToDate ? 'To date' : 'At quarter end'} ·{' '}
                            <DateLabel value={q.cutoff} />
                          </CutLink>
                        </td>
                        {(['recorded', 'reconstructed'] as const).map((nature) => {
                          const list = inQuarter.filter((s) => s.nature === nature);
                          return (
                            <td
                              key={nature}
                              data-label={`${nature[0].toUpperCase()}${nature.slice(1)} snapshots`}
                            >
                              {list.length ? (
                                <ul className="plain">
                                  {list.map((s) => (
                                    <li key={s.id}>
                                      <CutLink id={s.id} active={active === s.id}>
                                        Revision {s.revision} · created{' '}
                                        <DateLabel value={s.createdAt} />
                                      </CutLink>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="cell-empty">None saved</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          {kind !== 'unknown' && (
            <>
              <section className="section" aria-labelledby="cut-comparison-heading">
                <div className="section-head">
                  <h2 id="cut-comparison-heading">Comparison at this cut</h2>
                  <p className="section-note">
                    {snapshot
                      ? 'Only the observation versions pinned by this snapshot are shown.'
                      : 'Observations eligible at the cutoff under recorded availability.'}{' '}
                    Filters are shared with Latest Views.
                  </p>
                </div>
                <Comparison
                  data={data}
                  query={query}
                  snapshotId={snapshot?.id}
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                />
              </section>
              <section className="section" aria-labelledby="changes-heading">
                <div className="section-head">
                  <h2 id="changes-heading">Changes across cuts</h2>
                  <p className="section-note">
                    {prior ? (
                      <>
                        Each stream and asset at this cut compared with its latest recorded
                        observation at the {prior.id} cut (<InstantLabel value={prior.cutoff} />
                        ).
                      </>
                    ) : (
                      'No earlier quarter in coverage: each observation is a first covered observation.'
                    )}{' '}
                    Correction, omission, withdrawal and comparability boundaries are separate from
                    a change of allocation stance. Asset and stream filters apply.
                  </p>
                </div>
                {changes.length ? (
                  <ChangeHistory entries={changes} />
                ) : (
                  <p className="subtle">
                    No dated observations for the selected assets and streams.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
