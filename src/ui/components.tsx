import type { Cell, Query } from '../domain/selectors';
import { compareInstants, type Dataset, type Observation } from '../domain/schema';
import { assets } from '../domain/catalog';

export function DateLabel({
  value,
  precision = 'day',
}: {
  value: string | null;
  precision?: string;
}) {
  if (!value) return <span>Not disclosed</span>;
  const label = precision === 'month' ? value.slice(0, 7) : value.slice(0, 10);
  return (
    <time dateTime={value}>
      {label}
      {precision === 'month' ? ' (month only)' : ''}
    </time>
  );
}
export function StanceBadge({ status }: { status: Cell['status'] }) {
  return <span className={`stance stance-${status}`}>{status.replaceAll('-', ' ')}</span>;
}
export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
export function contextParams(query: Query, snapshotId?: string) {
  const params = new URLSearchParams({ cutoff: query.cutoff, nature: query.nature });
  if (query.knowledgeAt) params.set('knowledgeAt', query.knowledgeAt);
  if (snapshotId) params.set('snapshot', snapshotId);
  return params.toString();
}
export function ComparisonMatrix({
  data,
  cells,
  query,
  snapshotId,
}: {
  data: Dataset;
  cells: Cell[];
  query: Query;
  snapshotId?: string;
}) {
  return (
    <div
      className="matrix-scroll"
      role="region"
      aria-label="Research comparison matrix"
      tabIndex={0}
    >
      <table className="matrix">
        <caption>
          Latest explicit observations in selected coverage. One stream per institution. Dates
          belong to each observation.
        </caption>
        <thead>
          <tr>
            <th scope="col">Research stream</th>
            {assets
              .filter((a) => cells.some((c) => c.assetId === a.id))
              .map((a) => (
                <th scope="col" key={a.id}>
                  {a.label}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {data.streams
            .filter((s) => cells.some((c) => c.stream.id === s.id))
            .map((s) => (
              <tr key={s.id}>
                <th scope="row">
                  <a href={`#/institutions/${s.institutionId}`}>
                    {data.institutions.find((i) => i.id === s.institutionId)?.name}
                  </a>
                  <span className="subtle block">
                    {s.team} · {s.series}
                  </span>
                </th>
                {assets
                  .filter((a) => cells.some((c) => c.assetId === a.id))
                  .map((a) => {
                    const cell = cells.find((c) => c.stream.id === s.id && c.assetId === a.id);
                    if (!cell) return <td key={a.id}>Filtered out</td>;
                    const o = cell.observation;
                    const p = data.publications.find((p) => p.id === o?.publicationId);
                    return (
                      <td key={a.id} data-asset={a.label}>
                        <StanceBadge status={cell.status} />
                        {o && p ? (
                          <>
                            <a
                              className="cell-link"
                              aria-label={`Open ${data.institutions.find((i) => i.id === s.institutionId)?.name} ${a.label}`}
                              href={`#/observations/${o.id}?${contextParams(query, snapshotId)}`}
                            >
                              {o.originalStance ?? 'No explicit stance'}
                              <span className="block subtle">
                                Published{' '}
                                <DateLabel value={p.publishedDate} precision={p.datePrecision} />
                              </span>
                            </a>
                            <span className="block subtle">
                              Verified <DateLabel value={o.verifiedAt} />
                            </span>
                            {cell.notRenewed && (
                              <span className="block annotation">
                                Not renewed in later publication
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="block subtle">No eligible dated view</span>
                        )}
                        {cell.reasons.length > 0 && (
                          <details>
                            <summary>Exclusion reasons</summary>
                            <ul>
                              {cell.reasons.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    );
                  })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
export function SourceDetail({
  data,
  observation,
  knowledgeAt,
}: {
  data: Dataset;
  observation: Observation;
  knowledgeAt: string;
}) {
  const publication = data.publications.find((p) => p.id === observation.publicationId)!;
  const stream = data.streams.find((s) => s.id === publication.streamId)!;
  const source = data.sources.find((s) => s.id === stream.sourceId)!;
  return (
    <section className="panel">
      <h2>Evidence & source</h2>
      <p>{observation.evidence.citation}</p>
      <p>
        <strong>Locator:</strong> {observation.evidence.locator}
      </p>
      {publication.officialUrl ? (
        <p>
          <a href={publication.officialUrl} target="_blank" rel="noreferrer noopener">
            Open official publication ↗
          </a>
        </p>
      ) : (
        <p className="notice">
          Synthetic evidence only. No external publication or authentic institutional recommendation
          exists.
        </p>
      )}
      <dl className="facts">
        <dt>Publication version</dt>
        <dd>{publication.version}</dd>
        <dt>Fingerprint</dt>
        <dd>{publication.fingerprint ?? 'Not available'}</dd>
        <dt>Source usage assessment</dt>
        <dd>
          {source.usage.status.replaceAll('_', ' ')} ·{' '}
          {source.usage.scope ?? 'Pending human review'}
        </dd>
        <dt>Source checked</dt>
        <dd>
          {source.verifiedAt && compareInstants(source.verifiedAt, knowledgeAt) <= 0 ? (
            <DateLabel value={source.verifiedAt} />
          ) : (
            'No source-level check recorded by this cut'
          )}
        </dd>
      </dl>
    </section>
  );
}
export function ChangeHistory({
  entries,
}: {
  entries: { id: string; date: string | null; label: string; change: string }[];
}) {
  return (
    <ol className="history">
      {entries.map((e) => (
        <li key={e.id}>
          <DateLabel value={e.date} /> · {e.label}
          <p>{e.change}</p>
        </li>
      ))}
    </ol>
  );
}
