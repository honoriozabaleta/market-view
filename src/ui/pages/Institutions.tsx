import { dataset } from '../../data/load';
import { assets } from '../../domain/catalog';
import { compareInstants } from '../../domain/schema';
import { selectCell, type Query } from '../selectors-ui';
import { DateLabel, EmptyState, PageHead, StanceBadge, contextParams, label } from '../components';
import { now } from '../clock';

const kindLabels = { asset_manager: 'Asset manager', bank: 'Bank', research_firm: 'Research firm' };

export function Institutions({ id }: { id?: string }) {
  const list = dataset.institutions.filter((i) => !id || i.id === id);
  const single = id ? list[0] : undefined;
  const query: Query = { cutoff: now, nature: 'recorded' };
  const releasedState = dataset.mode === 'demo' ? 'demo' : 'published';
  return (
    <>
      <PageHead
        back={
          id && (
            <a className="back-link" href="#/institutions">
              ← All institutions
            </a>
          )
        }
        kicker={single ? 'Institution' : 'Research streams'}
        title={single ? single.name : 'Institutions'}
      >
        <p className="lead">
          We compare a defined research stream — division, team and publication series — not a
          single house view of the whole group. An asset manager is identified as an asset manager.
        </p>
      </PageHead>
      {list.length === 0 ? (
        id && dataset.institutions.length > 0 ? (
          <EmptyState title="Institution not in coverage">
            This link does not identify an institution in the current coverage.
          </EmptyState>
        ) : (
          <EmptyState title="No approved institutions in coverage">
            Candidate discovery and source usage assessment remain pending.
          </EmptyState>
        )
      ) : (
        list.map((i) => (
          <article className="institution" key={i.id}>
            <header className="institution-head">
              {!single && (
                <h2>
                  <a href={`#/institutions/${i.id}`}>{i.name}</a>
                </h2>
              )}
              <p className="tags">
                <span className="tag">{kindLabels[i.kind]}</span>
                {i.isFictional && (
                  <span className="tag tag-warn">Entirely fictional demo identity</span>
                )}
              </p>
            </header>
            {dataset.streams
              .filter((s) => s.institutionId === i.id)
              .map((s) => {
                const source = dataset.sources.find((x) => x.id === s.sourceId)!;
                const publications = dataset.publications
                  .filter(
                    (p) =>
                      p.streamId === s.id &&
                      p.editorialState === releasedState &&
                      !!p.marketViewPublishedAt &&
                      compareInstants(p.marketViewPublishedAt, now) <= 0 &&
                      compareInstants(p.firstObservedAt, now) <= 0,
                  )
                  .sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''));
                const cells = assets.map((a) => ({
                  asset: a,
                  cell: selectCell(dataset, s, a.id, query),
                }));
                return (
                  <section className="stream" key={s.id} aria-labelledby={`stream-${s.id}`}>
                    <div className="stream-head">
                      <p className="kicker">Publication series</p>
                      <h3 id={`stream-${s.id}`}>{s.series}</h3>
                      <p className="subtle">
                        {s.division} · {s.team}
                      </p>
                      <p className="tags">
                        <span className={s.defaultForInstitution ? 'tag tag-accent' : 'tag'}>
                          {s.defaultForInstitution
                            ? 'Default comparison stream'
                            : 'Detail only; excluded from default counts'}
                        </span>
                      </p>
                    </div>
                    <div className="stream-body">
                      <dl className="facts facts-compact">
                        <dt>Expected cadence</dt>
                        <dd>
                          {s.expectedCadenceDays ? `${s.expectedCadenceDays} days` : 'Not verified'}
                        </dd>
                        <dt>Age policy</dt>
                        <dd>
                          {s.staleAfterDays} days from source publication · {s.stalenessBasis}
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
                        <dd>{label(source.usage.status)}</dd>
                        <dt>Publications in coverage</dt>
                        <dd>{publications.length}; this is not a completeness claim.</dd>
                      </dl>
                      <div className="table-frame">
                        <table className="stream-views stack-table">
                          <caption>
                            Latest observation per asset at <DateLabel value={now} />. Status in the
                            default 12-month comparison.
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Asset</th>
                              <th scope="col">Original statement</th>
                              <th scope="col">Published</th>
                              <th scope="col">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cells.map(({ asset, cell }) => {
                              const o = cell.observation;
                              const p = dataset.publications.find((x) => x.id === o?.publicationId);
                              return (
                                <tr key={asset.id}>
                                  <th scope="row">{asset.label}</th>
                                  <td data-label="Original statement">
                                    {o ? (
                                      <>
                                        <a href={`#/observations/${o.id}?${contextParams(query)}`}>
                                          {o.originalStance ?? 'No explicit stance'}
                                        </a>
                                        {cell.notRenewed && (
                                          <span className="annotation block">
                                            Not renewed in later publication
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="cell-empty">No eligible dated view</span>
                                    )}
                                  </td>
                                  <td data-label="Published">
                                    {p ? (
                                      <DateLabel
                                        value={p.publishedDate}
                                        precision={p.datePrecision}
                                      />
                                    ) : (
                                      <span className="cell-empty">—</span>
                                    )}
                                  </td>
                                  <td data-label="Status">
                                    <StanceBadge status={cell.status} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {publications.length > 0 && (
                        <details className="publications">
                          <summary>Publications in coverage ({publications.length})</summary>
                          <ul>
                            {publications.map((p) => (
                              <li key={p.id}>
                                <span className="history-date">
                                  <DateLabel value={p.publishedDate} precision={p.datePrecision} />
                                </span>{' '}
                                {p.title} · version {p.version}
                                {!p.publishedDate && (
                                  <span className="annotation block">
                                    Undated: excluded from latest selection
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </section>
                );
              })}
          </article>
        ))
      )}
    </>
  );
}
