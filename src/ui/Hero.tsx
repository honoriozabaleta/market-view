import { AnimatePresence, motion } from 'motion/react';
import { ASSETS } from '../domain/catalog';
import type { EditionModel } from '../domain/model';
import { Globe } from './Globe';
import { CountUp, EASE, formatDate, Reveal, WordReveal } from './primitives';

function countsText(c: { ow: number; n: number; uw: number }, missing = 0) {
  return `${c.ow} OW · ${c.n} N · ${c.uw} UW${missing ? ` · ${missing} no view` : ''}`;
}

function Glance({ model }: { model: EditionModel }) {
  const { strongest, split, changes, previous } = model;
  const ups = changes.filter((c) => c.kind === 'upgrade').length;
  const downs = changes.filter((c) => c.kind === 'downgrade').length;
  const houseName = (id: string) => model.houses.find((h) => h.house.id === id)?.house.name ?? id;
  const assetName = (id: string) => ASSETS.find((a) => a.id === id)?.name ?? id;
  const moves = changes.filter((c) => c.kind === 'upgrade' || c.kind === 'downgrade').slice(0, 2);

  const cards = [
    strongest && {
      key: 'strong',
      ico: 'ow',
      glyph: '✓',
      label: 'Strongest consensus',
      value: `${strongest.stats.mode === 'uw' ? 'Underweight' : 'Overweight'} ${strongest.asset.name}`,
      meta: `${strongest.stats.counts[strongest.stats.mode!]} of ${strongest.stats.n} houses agree`,
    },
    split && {
      key: 'split',
      ico: 'split',
      glyph: '⇄',
      label: 'Biggest split',
      value: split.asset.name,
      meta: countsText(split.stats.counts, split.stats.missing),
    },
    {
      key: 'moves',
      ico: 'move',
      glyph: '↕',
      label: previous ? `Moves since ${previous.label}` : 'Moves',
      value: previous
        ? `${ups} upgrade${ups === 1 ? '' : 's'} · ${downs} downgrade${downs === 1 ? '' : 's'}`
        : 'First edition',
      meta: previous
        ? moves
            .map(
              (c) =>
                `${houseName(c.house)} ${c.kind === 'upgrade' ? 'upgrades' : 'downgrades'} ${assetName(c.asset)}`,
            )
            .join('; ') || 'No call changed'
        : 'Changes appear from the next edition',
    },
  ].filter(Boolean) as {
    key: string;
    ico: string;
    glyph: string;
    label: string;
    value: string;
    meta: string;
  }[];

  return (
    <div className="glance" aria-label="This quarter at a glance">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          className="glance-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.5 + i * 0.12 }}
        >
          <span className={`gl-ico ${c.ico}`} aria-hidden="true">
            {c.glyph}
          </span>
          <span className="gl-lab">{c.label}</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${model.edition.id}-${c.value}`}
              className="gl-val"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {c.value}
            </motion.span>
          </AnimatePresence>
          <span className="gl-meta">{c.meta}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function Hero({ model }: { model: EditionModel }) {
  const { edition, previous } = model;
  const changed = model.changes.filter(
    (c) => c.kind === 'upgrade' || c.kind === 'downgrade',
  ).length;
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <Reveal>
              <p className="eyebrow">
                <span className="pulse" aria-hidden="true" />
                {edition.label} Edition · Cut-off {formatDate(edition.cutoff)}
              </p>
            </Reveal>
            <h1 className="hero-title" id="hero-title">
              <WordReveal
                text="How the world's biggest banks see the markets, reconciled."
                accent="reconciled"
              />
            </h1>
            <Reveal delay={0.35}>
              <p className="lead">
                Global banks publish hundreds of pages of outlooks every quarter. We read them, put
                every call on one common scale, and show you where Wall Street agrees, where it is
                split — and what just changed.
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="cta">
                <a className="btn btn--primary" href="#consensus">
                  See the consensus <span aria-hidden="true">↓</span>
                </a>
                <a className="btn btn--ghost" href="#houses">
                  Meet the houses
                </a>
              </div>
            </Reveal>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
          >
            <Globe />
          </motion.div>
        </div>
        <Glance model={model} />
        <div className="kpis">
          <div>
            <CountUp className="kpi-n num" value={model.houses.length} />
            <span className="kpi-l">global houses</span>
          </div>
          <div>
            <CountUp className="kpi-n num" value={ASSETS.length} />
            <span className="kpi-l">asset classes</span>
          </div>
          <div>
            <CountUp className="kpi-n num" value={model.callCount} />
            <span className="kpi-l">calls reconciled</span>
          </div>
          <div>
            {previous ? (
              <CountUp className="kpi-n num" value={changed} />
            ) : (
              <span className="kpi-n">—</span>
            )}
            <span className="kpi-l">
              {previous ? `calls changed vs ${previous.label}` : 'first edition in the archive'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Ticker({ model }: { model: EditionModel }) {
  const items = model.assets.map((a) => (
    <span className="tick" key={a.asset.id}>
      <span className="tick-name">{a.asset.name}</span>
      <span className={`tick-v ${a.stats.verdict.tone}`}>{a.stats.verdict.label}</span>
      <span className="tick-c num">{countsText(a.stats.counts)}</span>
    </span>
  ));
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-label">{model.edition.label}</span>
      <div className="ticker-track">
        <div className="ticker-row" key={model.edition.id}>
          {items}
          {items.map((el) => (
            <span className="tick" key={`dup-${el.key}`}>
              {el.props.children}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EditorNote({ model }: { model: EditionModel }) {
  const note = model.edition.note;
  if (!note) return null;
  return (
    <div className="note-band">
      <Reveal className="wrap note">
        <span className="note-ico" aria-hidden="true">
          ✎
        </span>
        <div>
          <h2>{note.title}</h2>
          <p>{note.body}</p>
        </div>
      </Reveal>
    </div>
  );
}
