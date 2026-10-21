import { motion } from 'motion/react';
import { useState } from 'react';
import { CATEGORIES } from '../domain/catalog';
import type { EditionModel } from '../domain/model';
import { labelFor } from '../domain/model';
import type { OpenDetail } from './Consensus';
import {
  EASE,
  Mono,
  Reveal,
  SectionHead,
  shortLabel,
  stanceClass,
  trackPos,
  useSeen,
} from './primitives';

export function GridSection({ model, onOpen }: { model: EditionModel; onOpen: OpenDetail }) {
  const [changes, setChanges] = useState(false);
  const [tableRef, seen] = useSeen<HTMLTableElement>();
  let rowIndex = 0;

  return (
    <section className="section section--alt" id="grid" aria-labelledby="grid-title">
      <div className="wrap">
        <SectionHead
          id="grid"
          kicker="02 · Full grid"
          title="Every call, every house"
          sub={`${model.assets.length} asset classes across ${model.houses.length} houses. Select any cell for the original wording, the reasoning and the source.`}
        />
        <Reveal className="heat-tools">
          {model.previous ? (
            <button
              type="button"
              className="toggle"
              aria-pressed={changes}
              onClick={() => setChanges((c) => !c)}
            >
              <span className="sw" aria-hidden="true" />
              Highlight changes since {model.previous.label}
            </button>
          ) : (
            <span />
          )}
          <div className="legend" aria-label="Colour key">
            <span>
              <i style={{ background: 'var(--uw2)' }} />
              Strong UW
            </span>
            <span>
              <i style={{ background: 'var(--uw1)' }} />
              Underweight
            </span>
            <span>
              <i style={{ background: 'var(--n)' }} />
              Neutral
            </span>
            <span>
              <i style={{ background: 'var(--ow1)' }} />
              Overweight
            </span>
            <span>
              <i style={{ background: 'var(--ow2)' }} />
              Strong OW
            </span>
            <span>
              <i className="hatch" />
              No view published
            </span>
            <span>
              <b className="basis-key" aria-hidden="true">
                ≈
              </b>
              From the house's broader or narrower category
            </span>
          </div>
        </Reveal>
        <p className="heat-hint" aria-hidden="true">
          Swipe sideways to see every house →
        </p>
        <Reveal className="heat-scroll">
          <div
            tabIndex={0}
            role="region"
            aria-label="Grid of all calls, scrollable"
            style={{ overflowX: 'auto' }}
          >
            <table
              ref={tableRef}
              className={`heat${seen ? ' in' : ''}${changes ? ' changes' : ''}`}
            >
              <caption className="sr-only">Calls by asset and house, {model.edition.label}</caption>
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  {model.houses.map(({ house }) => (
                    <th scope="col" key={house.id}>
                      <Mono house={house} size="sm" />
                      <span className="h-name">{house.name}</span>
                      <span className="h-sub">{house.cadence}</span>
                    </th>
                  ))}
                  <th scope="col" className="cons">
                    Consensus
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => [
                  <tr className="grp" key={cat.id}>
                    <th colSpan={model.houses.length + 2} scope="colgroup">
                      {cat.name}
                    </th>
                  </tr>,
                  ...model.assets
                    .filter((a) => a.asset.category === cat.id)
                    .map((a) => {
                      rowIndex++;
                      const p = a.stats.avg === null ? 50 : trackPos(a.stats.avg);
                      return (
                        <tr key={a.asset.id}>
                          <th scope="row">{a.asset.name}</th>
                          {a.cells.map((c, ci) => {
                            const row = model.houses.find((h) => h.house.id === c.house.id)!;
                            const label = labelFor(row, c.call.score, c.call.label);
                            const dir =
                              c.change?.kind === 'upgrade'
                                ? 'up'
                                : c.change?.kind === 'downgrade'
                                  ? 'down'
                                  : c.change
                                    ? 'neutral'
                                    : null;
                            const changeText = c.change
                              ? c.change.kind === 'upgrade' || c.change.kind === 'downgrade'
                                ? `, ${c.change.kind}d from ${c.change.from.label}`
                                : c.change.kind === 'new'
                                  ? ', new view this edition'
                                  : ', view dropped this edition'
                              : '';
                            return (
                              <td key={c.house.id}>
                                <button
                                  type="button"
                                  className={`cell ${stanceClass(c.call.score)}`}
                                  style={{ ['--i' as string]: rowIndex + ci }}
                                  data-chg={dir ?? undefined}
                                  aria-label={`${c.house.name}, ${a.asset.name}: ${label}${c.call.basis ? `, based on its “${c.call.basis}” category` : ''}${changeText}. Open details`}
                                  onClick={(e) => onOpen(a.asset.id, c.house.id, e.currentTarget)}
                                >
                                  {shortLabel(c.call.score)}
                                  {c.call.basis && (
                                    <span className="c-basis" aria-hidden="true">
                                      ≈
                                    </span>
                                  )}
                                  {dir && (
                                    <>
                                      <span className={`c-chg ${dir}`} aria-hidden="true">
                                        {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'}
                                      </span>
                                      <span className="c-from" aria-hidden="true">
                                        was {shortLabel(c.change!.from.score)}
                                      </span>
                                    </>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                          <td className="cons">
                            <span className="cbar" aria-hidden="true">
                              <motion.span
                                className="cbar-fill"
                                initial={false}
                                animate={{
                                  left: `${Math.min(50, p)}%`,
                                  width: `${Math.abs(p - 50)}%`,
                                  backgroundColor: (a.stats.avg ?? 0) >= 0 ? '#47b38e' : '#ee8b78',
                                }}
                                transition={{ duration: 0.8, ease: EASE }}
                              />
                            </span>
                            <span className="cv">{a.stats.verdict.label}</span>
                          </td>
                        </tr>
                      );
                    }),
                ])}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
