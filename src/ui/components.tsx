import type { Cell, Query, descriptiveCounts } from '../domain/selectors';
import { compareInstants, type Dataset, type Observation } from '../domain/schema';

export function DateLabel({
  value,
  precision = 'day',
}: {
  value: string | null;
  precision?: string;
}) {
  if (!value) return <span className="date-missing">Not disclosed</span>;
  const label = precision === 'month' ? value.slice(0, 7) : value.slice(0, 10);
  return (
    <time dateTime={value} className="date">
      {label}
      {precision === 'month' ? ' (month only)' : ''}
    </time>
  );
}
/** Exact UTC instant (cutoffs, snapshot creation): never shortened to a calendar day. */
export function InstantLabel({ value }: { value: string }) {
  return (
    <time dateTime={value} className="date">
      {value.slice(0, 10)} {value.slice(11, 19)} UTC
    </time>
  );
}

export const statusLabels: Record<Cell['status'], string> = {
  favorable: 'Favorable',
  neutral: 'Neutral',
  unfavorable: 'Unfavorable',
  'not-disclosed': 'Not disclosed',
  'not-comparable': 'Not comparable',
  stale: 'Stale',
  withdrawn: 'Withdrawn',
};
export const statusOrder = Object.keys(statusLabels) as Cell['status'][];
/** Plain-language reading of each status; mirrors docs/METHODOLOGY.md, adds no rule. */
const statusDefinitions: Record<Cell['status'], string> = {
  favorable:
    'Explicit allocation label with a documented mapping for this stream, universe, horizon, reference and currency.',
  neutral:
    'Explicit allocation label mapped to neutral under the same exact rules. Never inferred from silence or omission.',
  unfavorable: 'Explicit allocation label mapped to unfavorable under the same exact rules.',
  'not-disclosed':
    'No dated, eligible explicit observation in our coverage. Absence is not neutral.',
  'not-comparable':
    'Covered, but outside the selected cohort: different type, horizon, reference, universe or currency, or no documented mapping. Its evidence remains available.',
  stale:
    'Source publication is older than the stream’s age policy, even when it was verified recently.',
  withdrawn: 'The source explicitly withdrew the view; the earlier stance is not carried forward.',
};

export type Counts = ReturnType<typeof descriptiveCounts>;
/**
 * Proportional strip of descriptiveCounts. The favorable/neutral/unfavorable split is drawn only
 * when coverage is sufficient; otherwise only comparable vs not compared. Always paired with text.
 */
export function CountBar({ count }: { count: Counts }) {
  const notCompared = count.cohortSize - count.denominator;
  const segments: [string, number][] = count.sufficient
    ? [
        ['favorable', count.favorable],
        ['neutral', count.neutral],
        ['unfavorable', count.unfavorable],
      ]
    : [['comparable', count.denominator]];
  return (
    <span className="count-bar" aria-hidden="true">
      {segments.map(
        ([kind, value]) =>
          value > 0 && (
            <span key={kind} className={`seg seg-${kind}`} style={{ flexGrow: value }} />
          ),
      )}
      {notCompared > 0 && <span className="seg seg-excluded" style={{ flexGrow: notCompared }} />}
    </span>
  );
}
export function coverageText(count: Counts) {
  return `${count.denominator} of ${count.cohortSize} comparable`;
}

export function StanceBadge({ status, id }: { status: Cell['status']; id?: string }) {
  return (
    <span id={id} className={`stance stance-${status}`}>
      {statusLabels[status]}
    </span>
  );
}
export function StatusKey() {
  return (
    <div className="status-key">
      <dl>
        {statusOrder.map((s) => (
          <div key={s}>
            <dt>
              <StanceBadge status={s} />
            </dt>
            <dd>{statusDefinitions[s]}</dd>
          </div>
        ))}
        <div>
          <dt>
            <span className="annotation">Not renewed</span>
          </dt>
          <dd>
            A later publication from the same stream did not restate this asset. The view keeps its
            own date; it is not reaffirmed.
          </dd>
        </div>
      </dl>
      <p className="subtle">
        When states coexist the cell shows withdrawn first, then stale, then comparability.
        Allocation labels are not price forecasts or directional calls. Color only repeats the text
        label.
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  );
}
export function PageHead({
  kicker,
  title,
  children,
  aside,
  back,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <header className={aside ? 'page-head page-head-split' : 'page-head'}>
      <div className="page-head-main">
        {back}
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {children}
      </div>
      {aside && <div className="page-head-aside">{aside}</div>}
    </header>
  );
}
export function contextParams(query: Query, snapshotId?: string) {
  const params = new URLSearchParams({ cutoff: query.cutoff, nature: query.nature });
  if (query.knowledgeAt) params.set('knowledgeAt', query.knowledgeAt);
  if (snapshotId) params.set('snapshot', snapshotId);
  return params.toString();
}
export const label = (value: string) => value.replaceAll('_', ' ').replaceAll('-', ' ');

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
    <section className="doc-section" aria-labelledby="evidence-heading">
      <p className="kicker kicker-source">From the source</p>
      <h2 id="evidence-heading">Evidence & source</h2>
      {!publication.officialUrl && (
        <p className="notice">
          Synthetic evidence only. No external publication or authentic institutional recommendation
          exists.
        </p>
      )}
      <dl className="facts">
        <dt>Citation</dt>
        <dd>{observation.evidence.citation}</dd>
        <dt>Locator</dt>
        <dd>{observation.evidence.locator}</dd>
        {publication.officialUrl && (
          <>
            <dt>Official publication</dt>
            <dd>
              <a href={publication.officialUrl} target="_blank" rel="noreferrer noopener">
                Open official publication ↗
              </a>
            </dd>
          </>
        )}
        <dt>Publication version</dt>
        <dd>{publication.version}</dd>
        <dt>Fingerprint</dt>
        <dd className={publication.fingerprint ? 'mono' : undefined}>
          {publication.fingerprint ?? 'Not available'}
        </dd>
        <dt>Source usage assessment</dt>
        <dd>
          {label(source.usage.status)} · {source.usage.scope ?? 'Pending human review'}
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
/** Already-classified change labels; gaps are listed, never joined into a continuous line. */
export function ChangeHistory({
  entries,
}: {
  entries: { id: string; date: string | null; label: string; change: string }[];
}) {
  return (
    <ol className="history">
      {entries.map((e) => (
        <li key={e.id}>
          <span className="history-date">
            <DateLabel value={e.date} />
          </span>
          <span className="history-label">{e.label}</span>
          <span className="history-change">{e.change}</span>
        </li>
      ))}
    </ol>
  );
}
