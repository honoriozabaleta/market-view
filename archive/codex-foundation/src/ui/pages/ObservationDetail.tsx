import { dataset } from '../../data/load';
import { assets } from '../../domain/catalog';
import { compareInstants, InstantSchema } from '../../domain/schema';
import {
  changeBetween,
  defaultCohort,
  editoriallyEligible,
  eligibleObservations,
  publicationUpperBoundForUI,
  quarterOf,
  selectCell,
  snapshotQuery,
  type Query,
} from '../selectors-ui';
import {
  ChangeHistory,
  DateLabel,
  EmptyState,
  InstantLabel,
  SourceDetail,
  StanceBadge,
  contextParams,
  comparisonHorizon,
  label,
} from '../components';
import { now } from '../clock';

const viewTypeLabels = {
  allocation: 'Allocation stance',
  directional: 'Directional view',
  quantitative: 'Quantitative forecast',
  narrative: 'Narrative',
};

export function ObservationDetail({
  id,
  params,
  evidenceOnly,
}: {
  id?: string;
  params: URLSearchParams;
  evidenceOnly: boolean;
}) {
  const snapshotId = params.get('snapshot') ?? undefined;
  const horizonMonths = comparisonHorizon(params);
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
    horizonMonths === null ||
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
  const cell = selectCell(
    detailData,
    stream,
    observation.assetId,
    query,
    defaultCohort(observation.assetId, horizonMonths),
  );
  const mapping = dataset.mappings.find((m) => m.id === observation.mappingRuleId);
  const review = dataset.reviews.find((r) => r.observationId === observation.id)!;
  const knowledgeAt = query.nature === 'recorded' ? query.cutoff : query.knowledgeAt!;
  const isCellObservation = cell.observation?.id === observation.id;
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
  const assetLabel = assets.find((a) => a.id === observation.assetId)?.label;
  const archived = !!snapshotId || query.cutoff !== now;
  const cutLabel = pinned
    ? `${query.nature === 'reconstructed' ? 'Reconstructed' : 'Recorded'} snapshot ${snapshotId}`
    : archived
      ? `${query.nature === 'reconstructed' ? 'Reconstructed' : 'Recorded'} cut`
      : 'Latest Views';
  return (
    <article className="detail">
      <header className="page-head detail-head">
        <a
          className="back-link"
          href={archived ? `#/archive?cut=${snapshotId ?? quarterOf(query.cutoff)}` : '#/latest'}
        >
          ← Back to comparison
        </a>
        <p className="kicker">
          {evidenceOnly ? 'Evidence' : 'View detail'} · {cutLabel}
        </p>
        <h1>{assetLabel}</h1>
        <p className="detail-who">
          <a href={`#/institutions/${institution.id}`}>{institution.name}</a>
          <span>
            {' '}
            · {stream.team} · {stream.series}
          </span>
        </p>
        <p className="subtle mono-line">
          Selected observation: {observation.id} · Cutoff {query.cutoff} · {query.nature}
        </p>
      </header>
      {evidenceOnly ? (
        <>
          <SourceDetail data={dataset} observation={observation} knowledgeAt={knowledgeAt} />
          <p>
            <a
              className="button-link"
              href={`#/observations/${observation.id}?${contextParams(query, snapshotId, horizonMonths)}`}
            >
              Open full view detail
            </a>
          </p>
        </>
      ) : (
        <div className="detail-layout">
          <div className="detail-summary">
            <div className="summary-block summary-source">
              <p className="kicker kicker-source">Source says</p>
              <p className="summary-original">
                Original stance: <strong>{observation.originalStance ?? 'Not disclosed'}</strong>
              </p>
              <p className="subtle">
                {viewTypeLabels[observation.viewType]} ·{' '}
                {observation.horizon.original ?? 'Horizon not disclosed'}
              </p>
            </div>
            <div className="summary-block summary-ours">
              <p className="kicker kicker-ours">Market View classification</p>
              {isCellObservation ? (
                <>
                  <p>
                    <StanceBadge status={cell.status} />
                  </p>
                  <p className="subtle">
                    Status in the {horizonMonths}-month comparison at this cut.
                  </p>
                </>
              ) : observation.normalizedStance ? (
                <>
                  <p>
                    <StanceBadge status={observation.normalizedStance} />
                  </p>
                  <p className="subtle">
                    Normalized stance of this revision; it is not the current cell at this cut.
                  </p>
                </>
              ) : (
                <p>No normalized classification for this revision.</p>
              )}
            </div>
            <div className="summary-block summary-date">
              <p className="kicker">Published by source</p>
              <p className="summary-figure">
                <DateLabel value={p.publishedDate} precision={p.datePrecision} />
              </p>
              <p className="subtle">
                Verified <DateLabel value={observation.verifiedAt} />
                {cell.notRenewed && isCellObservation && (
                  <span className="annotation block">Not renewed in later publication</span>
                )}
              </p>
            </div>
          </div>

          <aside className="detail-aside" aria-labelledby="dates-heading">
            <h2 id="dates-heading" className="aside-title">
              Dates & review
            </h2>
            <dl className="date-trail">
              <div>
                <dt>Published by source</dt>
                <dd>
                  <DateLabel value={p.publishedDate} precision={p.datePrecision} />
                </dd>
              </div>
              <div>
                <dt>First observed</dt>
                <dd>
                  <DateLabel value={p.firstObservedAt} />
                </dd>
              </div>
              <div>
                <dt>Observation verified</dt>
                <dd>
                  <DateLabel value={observation.verifiedAt} />
                </dd>
              </div>
              <div>
                <dt>Editorial review</dt>
                <dd>
                  {review.status} · {review.reviewer ?? 'No human reviewer claimed'} ·{' '}
                  <DateLabel value={review.at} />
                </dd>
              </div>
              <div>
                <dt>First published in Market View</dt>
                <dd>
                  <DateLabel value={observation.firstPublishedAt} />
                </dd>
              </div>
              <div>
                <dt>Revision</dt>
                <dd>
                  {label(observation.revisionKind)} · {observation.status}
                </dd>
              </div>
              <div>
                <dt>Query cut</dt>
                <dd>
                  <InstantLabel value={query.cutoff} /> · {query.nature}
                </dd>
              </div>
            </dl>
            <p className="subtle">
              Verification does not renew a view: age is measured from source publication.{' '}
              <a href="#/methodology/time">Time rules</a>
            </p>
          </aside>

          <div className="detail-main">
            <section className="doc-section" aria-labelledby="statement-heading">
              <p className="kicker kicker-source">From the source</p>
              <h2 id="statement-heading">Source statement</h2>
              <dl className="facts">
                <dt>Original asset / universe</dt>
                <dd>
                  {observation.originalAsset} · {observation.originalUniverse}
                </dd>
                <dt>View type</dt>
                <dd>{viewTypeLabels[observation.viewType]}</dd>
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
              </dl>
              <h3>Thesis</h3>
              <p className="claim">{observation.thesis.text}</p>
              <p className="citation">
                Evidence: {observation.thesis.evidence.citation} ·{' '}
                {observation.thesis.evidence.locator}
              </p>
              <h3>Risks</h3>
              <ul className="claims">
                {observation.risks.map((r, i) => (
                  <li key={i}>
                    <span className="claim">{r.text}</span>
                    <span className="citation block">
                      Evidence: {r.evidence.citation} · {r.evidence.locator}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                className="button-link"
                href={`#/evidence/${observation.id}?${contextParams(query, snapshotId, horizonMonths)}`}
              >
                View evidence
              </a>
            </section>

            <section
              className="doc-section doc-section-ours"
              aria-labelledby="interpretation-heading"
            >
              <p className="kicker kicker-ours">Our editorial classification — not the source</p>
              <h2 id="interpretation-heading">Market View interpretation</h2>
              <p>
                This normalization is an editorial classification, separate from the original
                statement.
              </p>
              <dl className="facts">
                <dt>Mapping</dt>
                <dd>
                  {mapping
                    ? `${mapping.originalLabel} → ${mapping.normalized}. ${mapping.rationale}`
                    : 'No approved context-specific mapping. This observation does not feed a normalized allocation classification.'}
                </dd>
                <dt>Normalized universe</dt>
                <dd>
                  {observation.universe.geography} · {label(observation.universe.scope)} ·{' '}
                  {observation.universe.currency ?? 'Unknown currency'}
                </dd>
                {observation.editorialInterpretation && (
                  <>
                    <dt>Interpretation</dt>
                    <dd>
                      {observation.editorialInterpretation.text}
                      <span className="citation block">
                        Evidence: {observation.editorialInterpretation.evidence.citation} ·{' '}
                        {observation.editorialInterpretation.evidence.locator}
                      </span>
                    </dd>
                  </>
                )}
                <dt>Comparison status</dt>
                <dd>
                  {isCellObservation
                    ? `${cell.notRenewed ? 'Not renewed in a later partial publication. ' : ''}${
                        cell.reasons.length
                          ? cell.reasons.join('; ')
                          : `Meets the ${horizonMonths}-month cohort.`
                      }`
                    : 'This revision is not the comparison cell at this cut; a later or replacing revision is used there.'}
                </dd>
                <dt>Age policy</dt>
                <dd>
                  {stream.staleAfterDays} days from source publication, not from verification.{' '}
                  {stream.stalenessBasis}.
                </dd>
              </dl>
            </section>

            <SourceDetail data={dataset} observation={observation} knowledgeAt={knowledgeAt} />

            <section className="doc-section" aria-labelledby="history-heading">
              <h2 id="history-heading">Observation history within this cut</h2>
              <ChangeHistory
                entries={history.map((o, i) => ({
                  id: o.id,
                  date: dataset.publications.find((p) => p.id === o.publicationId)!.publishedDate,
                  label: `${o.originalStance ?? 'No stance'} · ${label(o.revisionKind)}`,
                  change: changeBetween(dataset, history[i - 1] ?? null, o),
                }))}
              />
            </section>
          </div>
        </div>
      )}
    </article>
  );
}
