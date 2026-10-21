import { assets } from '../domain/catalog';
import type { Dataset } from '../domain/schema';
import { statusLabels, statusOrder } from './components';
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
  const pristine =
    value.asset === initialFilters.asset &&
    value.stream === initialFilters.stream &&
    value.horizon === initialFilters.horizon &&
    value.status === initialFilters.status;
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Comparison filters">
      <div className="filter-field filter-asset">
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
      <div className="filter-field filter-stream">
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
      <fieldset className="filter-field filter-horizon">
        <legend>Comparison horizon</legend>
        <div className="segmented">
          {[12, 3].map((h) => (
            <label key={h}>
              <input
                type="radio"
                name="filter-horizon"
                value={h}
                checked={value.horizon === h}
                onChange={() => onChange({ ...value, horizon: h })}
              />
              <span>{h} months</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="filter-field filter-status">
        <label htmlFor="filter-status">Display status</label>
        <select
          id="filter-status"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
        >
          <option value="all">All statuses</option>
          {statusOrder.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="button-quiet filter-reset"
        disabled={pristine}
        onClick={() => onChange(initialFilters)}
      >
        Reset filters
      </button>
    </form>
  );
}
