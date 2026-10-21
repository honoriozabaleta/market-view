import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  categoryName,
  type AssetId,
  type CategoryId,
  type HouseId,
} from '../domain/catalog';
import type { Change } from '../domain/consensus';
import type { AssetRow, EditionModel } from '../domain/model';
import { labelFor } from '../domain/model';
import { DotTrack } from './DotTrack';
import { EASE, Mono, Reveal, SectionHead, Segmented, stanceClass, VerdictPill } from './primitives';

export type OpenDetail = (asset: AssetId, house: HouseId, trigger: HTMLElement) => void;

export const countsText = (r: AssetRow) =>
  `${r.stats.counts.ow} OW · ${r.stats.counts.n} N · ${r.stats.counts.uw} UW${r.stats.missing ? ` · ${r.stats.missing} no view` : ''}`;

export function ChangeBadge({ change }: { change: Change | null }) {
  if (!change) return null;
  if (change.kind === 'new') return <span className="chg neutral">New view</span>;
  if (change.kind === 'dropped') return <span className="chg neutral">View dropped</span>;
  const up = change.kind === 'upgrade';
  return (
    <span className={`chg ${up ? 'up' : 'down'}`}>
      {up ? '▲' : '▼'} from {change.from.label}
    </span>
  );
}

const SORTS = [
  { id: 'bull', name: 'Most bullish first' },
  { id: 'split', name: 'Most divided first' },
] as const;

export function ConsensusSection({ model, onOpen }: { model: EditionModel; onOpen: OpenDetail }) {
  const [cat, setCat] = useState<'all' | CategoryId>('all');
  const [sort, setSort] = useState<'bull' | 'split'>('bull');
  const [highlight, setHighlight] = useState<HouseId | null>(null);
  const [moves, setMoves] = useState(false);
  const [open, setOpen] = useState<Set<AssetId>>(new Set());

  const rows = useMemo(() => {
    const described = (r: AssetRow) => (r.stats.avg === null ? -9 : r.stats.avg);
    const sorted = [...model.assets].sort((x, y) =>
      sort === 'bull'
        ? described(y) - described(x) || (y.stats.agreement ?? 0) - (x.stats.agreement ?? 0)
        : (x.stats.agreement ?? 2) - (y.stats.agreement ?? 2) ||
          (y.stats.sd ?? 0) - (x.stats.sd ?? 0),
    );
    return sorted.filter((r) => cat === 'all' || r.asset.category === cat);
  }, [model, sort, cat]);

  const toggle = (id: AssetId) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="section" id="consensus" aria-labelledby="consensus-title">
      <div className="wrap">
        <SectionHead
          id="consensus"
          kicker="01 · Consensus"
          title="Where the consensus sits"
          sub="Each dot is one house's current call on a common five-step scale, from strong underweight to strong overweight. Open any asset to read the reasoning behind every call."
        />
        <Reveal className="toolbar">
          <Segmented
            label="Filter by asset class"
            layoutId="cat-pill"
            options={[{ id: 'all', name: 'All' }, ...CATEGORIES]}
            value={cat}
            onChange={setCat}
          />
          <div className="toolbar-group">
            <Segmented
              label="Sort assets"
              layoutId="sort-pill"
              options={SORTS}
              value={sort}
              onChange={setSort}
            />
            {model.previous && (
              <button
                type="button"
                className="toggle"
                aria-pressed={moves}
                onClick={() => setMoves((m) => !m)}
              >
                <span className="sw" aria-hidden="true" />
                Show moves since {model.previous.label}
              </button>
            )}
          </div>
        </Reveal>
        <Reveal className="hlegend">
          <span className="hlegend-k">Highlight a house:</span>
          {model.houses.map(({ house }) => (
            <button
              key={house.id}
              type="button"
              className="hchip"
              aria-pressed={highlight === house.id}
              onClick={() => setHighlight((h) => (h === house.id ? null : house.id))}
            >
              <Mono house={house} size="sm" />
              {house.name}
            </button>
          ))}
          <span className="hlegend-k avg-key">
            <span aria-hidden="true">◆</span> Average call
          </span>
        </Reveal>
        <Reveal className="meter">
          <div className="m-head" aria-hidden="true">
            <div className="m-grid">
              <span>Asset</span>
              <span className="scale-labels">
                <span>Underweight</span>
                <span>Neutral</span>
                <span>Overweight</span>
              </span>
              <span>Verdict</span>
              <span />
            </div>
          </div>
          <motion.ol className="m-list" layout="position">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((r) => {
                const isOpen = open.has(r.asset.id);
                const summary = `${r.asset.name}: ${r.stats.verdict.label}. ${r.cells
                  .map(
                    (c) =>
                      `${c.house.name} ${labelFor(
                        model.houses.find((h) => h.house.id === c.house.id)!,
                        c.call.score,
                        c.call.label,
                      )}`,
                  )
                  .join(', ')}.`;
                return (
                  <motion.li
                    key={r.asset.id}
                    layout="position"
                    className={`m-row${isOpen ? ' open' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
                  >
                    <button
                      type="button"
                      className="m-btn m-grid"
                      aria-expanded={isOpen}
                      aria-controls={`exp-${r.asset.id}`}
                      onClick={() => toggle(r.asset.id)}
                    >
                      <span className="m-name">
                        <strong>{r.asset.name}</strong>
                        <small>{categoryName(r.asset.category)}</small>
                      </span>
                      <DotTrack
                        dots={r.cells.map((c) => ({
                          house: c.house,
                          score: c.call.score,
                          from: c.change?.from.score,
                        }))}
                        avg={r.stats.avg}
                        highlight={highlight}
                        showMoves={moves}
                      />
                      <span className="m-verdict">
                        <VerdictPill tone={r.stats.verdict.tone} label={r.stats.verdict.label} />
                        <small className="num">{countsText(r)}</small>
                      </span>
                      <span className="chev" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                          <path
                            d="M2 4l4 4 4-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="sr-only">{summary}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`exp-${r.asset.id}`}
                          className="m-exp"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                        >
                          <ul className="calls">
                            {r.cells.map((c, i) => {
                              const row = model.houses.find((h) => h.house.id === c.house.id)!;
                              return (
                                <motion.li
                                  key={c.house.id}
                                  className="call"
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: EASE }}
                                >
                                  <Mono house={c.house} />
                                  <div>
                                    <div className="call-top">
                                      <strong>{c.house.name}</strong>
                                      <span className={`chip ${stanceClass(c.call.score)}`}>
                                        {labelFor(row, c.call.score, c.call.label)}
                                      </span>
                                      <ChangeBadge change={c.change} />
                                    </div>
                                    <p>{c.call.thesis}</p>
                                    {c.call.basis && (
                                      <p className="call-basis">
                                        ≈ From its “{c.call.basis}” category
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      className="linkbtn"
                                      onClick={(e) =>
                                        onOpen(r.asset.id, c.house.id, e.currentTarget)
                                      }
                                    >
                                      Details and source
                                    </button>
                                  </div>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ol>
        </Reveal>
      </div>
    </section>
  );
}
