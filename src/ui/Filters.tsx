import { assets } from '../domain/catalog';
import type { Dataset } from '../domain/schema';
export type Filters = { asset: string; stream: string; horizon: number; status: string };
export const initialFilters: Filters = { asset: 'all', stream: 'all', horizon: 12, status: 'all' };
export function ComparisonFilters({
  data,
  value,
  onChange,
}: {
  data: Dataset;
  value: Filters;
  onChange: (value: Filters) => void;
}) {
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Comparison filters">
      <div className="filter-field">
        <label htmlFor="filter-asset">Asset</label>
        <select
          id="filter-asset"
          value={value.asset}
          onChange={(e) => onChange({ ...value, asset: e.target.value })}
        >
          <option value="all">All assets</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-stream">Research stream</label>
        <select
          id="filter-stream"
          value={value.stream}
          onChange={(e) => onChange({ ...value, stream: e.target.value })}
        >
          <option value="all">All default streams</option>
          {data.streams
            .filter((s) => s.defaultForInstitution)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {data.institutions.find((i) => i.id === s.institutionId)?.name} · {s.series}
              </option>
            ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-horizon">Comparison horizon</label>
        <select
          id="filter-horizon"
          value={value.horizon}
          onChange={(e) => onChange({ ...value, horizon: Number(e.target.value) })}
        >
          <option value={12}>12 months</option>
          <option value={3}>3 months</option>
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-status">Display status</label>
        <select
          id="filter-status"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
        >
          <option value="all">All statuses</option>
          {[
            'favorable',
            'neutral',
            'unfavorable',
            'not-disclosed',
            'not-comparable',
            'stale',
            'withdrawn',
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('-', ' ')}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={() => onChange(initialFilters)}>
        Reset filters
      </button>
    </form>
  );
}
