import { useEffect, useRef, useState } from 'react';
import { assets } from '../domain/catalog';
import type { Dataset, ResearchStream } from '../domain/schema';
import type { Cell, Query } from '../domain/selectors';
import {
  CountBar,
  DateLabel,
  StanceBadge,
  contextParams,
  coverageText,
  type Counts,
} from './components';

export type Coverage = Partial<Record<string, Counts>>;
type Props = {
  data: Dataset;
  cells: Cell[];
  query: Query;
  snapshotId?: string;
  coverage: Coverage;
  horizonMonths: number;
};

/**
 * Desktop/tablet: one table, sticky stream column, contained horizontal scroll with cues.
 * <=600 px: the same cells regrouped by asset so each asset compares every stream at a glance.
 * Exactly one of the two layouts is displayed; the other is display:none (out of the a11y tree).
 */
export function ComparisonMatrix(props: Props) {
  return (
    <>
      <MatrixTable {...props} />
      <AssetList {...props} />
    </>
  );
}

function institutionName(data: Dataset, stream: ResearchStream) {
  return data.institutions.find((i) => i.id === stream.institutionId)?.name ?? stream.institutionId;
}
function AssetCoverage({ count }: { count?: Counts }) {
  if (!count) return null;
  return (
    <span className="th-coverage">
      <CountBar count={count} />
      <span className="th-meta">{coverageText(count)}</span>
    </span>
  );
}

function CellBody({
  cell,
  data,
  query,
  snapshotId,
  idPrefix,
  horizonMonths,
}: {
  cell: Cell;
  data: Dataset;
  query: Query;
  snapshotId?: string;
  idPrefix: string;
  horizonMonths: number;
}) {
  const o = cell.observation;
  const p = data.publications.find((x) => x.id === o?.publicationId);
  const asset = assets.find((a) => a.id === cell.assetId)!;
  const id = `${idPrefix}-${cell.stream.id}-${cell.assetId}`;
  return (
    <div className="cell">
      <StanceBadge status={cell.status} id={`${id}-status`} />
      {o && p ? (
        <>
          <a
            className="cell-link"
            aria-label={`Open ${institutionName(data, cell.stream)} ${asset.label}: ${o.originalStance ?? 'No explicit stance'}`}
            aria-describedby={`${id}-status ${id}-stance ${id}-dates`}
            href={`#/observations/${o.id}?${contextParams(query, snapshotId, horizonMonths)}`}
          >
            <span className="cell-stance" id={`${id}-stance`}>
              {o.originalStance ?? 'No explicit stance'}
            </span>
          </a>
          <span className="cell-dates" id={`${id}-dates`}>
            <span>
              <span className="date-tag" aria-hidden="true">
                Pub
              </span>
              <span className="visually-hidden">Published </span>
              <DateLabel value={p.publishedDate} precision={p.datePrecision} />
            </span>
            <span>
              <span className="date-tag" aria-hidden="true">
                Ver
              </span>
              <span className="visually-hidden">Verified </span>
              <DateLabel value={o.verifiedAt} />
            </span>
          </span>
          {cell.notRenewed && <span className="annotation">Not renewed in later publication</span>}
        </>
      ) : (
        <span className="cell-empty">No eligible dated view</span>
      )}
      {cell.reasons.length > 0 && (
        <details className="reasons">
          <summary>Reasons ({cell.reasons.length})</summary>
          <ul>
            {cell.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflow: false, start: true, end: true });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { overflow: max > 1, start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 };
      setState((prev) =>
        prev.overflow === next.overflow && prev.start === next.start && prev.end === next.end
          ? prev
          : next,
      );
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);
  const scroll = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const sticky = el.querySelector('th')?.getBoundingClientRect().width ?? 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direction * Math.max(160, (el.clientWidth - sticky) * 0.8),
      behavior: reduce ? 'auto' : 'smooth',
    });
  };
  return { ref, state, scroll };
}

function MatrixTable({ data, cells, query, snapshotId, coverage, horizonMonths }: Props) {
  const columns = assets.filter((a) => cells.some((c) => c.assetId === a.id));
  const rows = data.streams.filter((s) => cells.some((c) => c.stream.id === s.id));
  const { ref, state, scroll } = useHorizontalScroll();
  return (
    <div className="matrix-frame">
      {state.overflow && (
        <div className="matrix-scrollbar">
          <p className="subtle">
            {columns.length} assets · scroll sideways or use the arrows. The stream column stays in
            place.
          </p>
          <div className="scroll-buttons">
            <button
              type="button"
              aria-label="Scroll to earlier assets"
              disabled={state.start}
              onClick={() => scroll(-1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Scroll to later assets"
              disabled={state.end}
              onClick={() => scroll(1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
      <div className="matrix-viewport" data-more={(state.overflow && !state.end) || undefined}>
        <div
          ref={ref}
          className="matrix-scroll"
          role="region"
          aria-label="Research comparison matrix"
          tabIndex={0}
          data-scrolled={!state.start || undefined}
        >
          <table className="matrix">
            <caption className="visually-hidden">
              Latest explicit observations in selected coverage. One stream per institution. Dates
              belong to each observation.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="matrix-corner">
                  Research stream
                </th>
                {columns.map((a) => (
                  <th scope="col" key={a.id}>
                    <span className="th-label">{a.label}</span>
                    <AssetCoverage count={coverage[a.id]} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <a href={`#/institutions/${s.institutionId}`}>{institutionName(data, s)}</a>
                    <span className="row-meta">
                      {s.team} · {s.series}
                    </span>
                  </th>
                  {columns.map((a) => {
                    const cell = cells.find((c) => c.stream.id === s.id && c.assetId === a.id);
                    if (!cell)
                      return (
                        <td key={a.id} className="cell-filtered">
                          <span className="cell-empty">Hidden by status filter</span>
                        </td>
                      );
                    return (
                      <td key={a.id} data-status={cell.status}>
                        <CellBody
                          cell={cell}
                          data={data}
                          query={query}
                          snapshotId={snapshotId}
                          idPrefix="mx"
                          horizonMonths={horizonMonths}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssetList({ data, cells, query, snapshotId, coverage, horizonMonths }: Props) {
  const columns = assets.filter((a) => cells.some((c) => c.assetId === a.id));
  return (
    <div className="asset-list">
      {columns.map((a) => (
        <section key={a.id} className="asset-block" aria-labelledby={`al-${a.id}`}>
          <div className="asset-block-head">
            <h3 id={`al-${a.id}`}>{a.label}</h3>
            <AssetCoverage count={coverage[a.id]} />
          </div>
          <ul>
            {data.streams.map((s) => {
              const cell = cells.find((c) => c.stream.id === s.id && c.assetId === a.id);
              if (!cell) return null;
              return (
                <li key={s.id} className="asset-row" data-status={cell.status}>
                  <p className="asset-row-who">
                    <span className="asset-row-name">{institutionName(data, s)}</span>
                    <span className="row-meta">{s.series}</span>
                  </p>
                  <CellBody
                    cell={cell}
                    data={data}
                    query={query}
                    snapshotId={snapshotId}
                    idPrefix="al"
                    horizonMonths={horizonMonths}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
