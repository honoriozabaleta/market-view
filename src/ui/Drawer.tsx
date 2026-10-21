import { useEffect, useRef } from 'react';
import { ASSET_BY_ID, COMMON_LABEL, scoreKey, type AssetId, type HouseId } from '../domain/catalog';
import type { EditionModel } from '../domain/model';
import { labelFor } from '../domain/model';
import { ChangeBadge } from './Consensus';
import { ExternalLink, formatDate, Mono, stanceClass } from './primitives';

export interface DrawerTarget {
  asset: AssetId;
  house: HouseId;
  trigger: HTMLElement;
}

/** Side panel with the full detail of one call. Native <dialog>: focus trap, Esc and focus return. */
export function Drawer({
  model,
  target,
  onClose,
}: {
  model: EditionModel;
  target: DrawerTarget | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (target && !d.open) {
      d.showModal();
      closeRef.current?.focus();
    }
    if (!target && d.open) d.close();
  }, [target]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      const trigger = target?.trigger;
      onClose();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
    d.addEventListener('close', onDialogClose);
    return () => d.removeEventListener('close', onDialogClose);
  }, [target, onClose]);

  const row = target ? model.houses.find((h) => h.house.id === target.house) : undefined;
  const cell = target
    ? model.assets
        .find((a) => a.asset.id === target.asset)
        ?.cells.find((c) => c.house.id === target.house)
    : undefined;

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {row && cell && target && (
        <div className="dr">
          <div className="dr-head">
            <Mono house={row.house} />
            <div>
              <small>{row.house.team}</small>
              <strong>{row.house.name}</strong>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="x"
              aria-label="Close details"
              onClick={() => ref.current?.close()}
            >
              ×
            </button>
          </div>
          <div className="dr-body">
            <h2 id="drawer-title">{ASSET_BY_ID[target.asset].name}</h2>
            <div className="dr-stance">
              <div className="big">{labelFor(row, cell.call.score, cell.call.label)}</div>
              <small>
                {cell.call.score === null
                  ? 'This publication states no explicit view on this asset. We leave it empty rather than call it neutral.'
                  : `Original wording · common scale: ${COMMON_LABEL[scoreKey(cell.call.score)]}`}
              </small>
              <div className="scale5" aria-hidden="true">
                {([-2, -1, 0, 1, 2] as const).map((k) => (
                  <span
                    key={k}
                    className={`${stanceClass(k)}${cell.call.score === k ? ' on' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="dr-sec">
              <h3>Why</h3>
              <p>{cell.call.thesis}</p>
            </div>
            {model.previous && (
              <div className="dr-sec">
                <h3>Change since {model.previous.label}</h3>
                <p>{cell.change ? <ChangeBadge change={cell.change} /> : 'Unchanged.'}</p>
              </div>
            )}
            <div className="dr-sec">
              <h3>Source</h3>
              <dl className="dr-meta">
                <dt>Team</dt>
                <dd>{row.house.team}</dd>
                <dt>Publication</dt>
                <dd>{row.entry.source.title}</dd>
                <dt>Published</dt>
                <dd>{formatDate(row.entry.source.published)}</dd>
                {cell.call.basis && (
                  <>
                    <dt>Category</dt>
                    <dd>
                      ≈ {row.house.name}’s “{cell.call.basis}” view, applied to{' '}
                      {ASSET_BY_ID[target.asset].name}
                    </dd>
                  </>
                )}
                {cell.call.locator && (
                  <>
                    <dt>Where</dt>
                    <dd>{cell.call.locator}</dd>
                  </>
                )}
              </dl>
            </div>
            <ExternalLink className="btn btn--dark" href={row.entry.source.url}>
              Open the official publication
            </ExternalLink>
            {model.edition.status !== 'published' && (
              <p className="dr-note">
                {model.edition.status === 'illustrative'
                  ? 'Illustrative preview data. In the live edition this panel shows the exact section of the report each call comes from.'
                  : 'Draft extraction pending the editor’s review.'}
              </p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
