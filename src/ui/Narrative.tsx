import { AnimatePresence, motion } from 'motion/react';
import { ASSET_BY_ID, HOUSE_BY_ID } from '../domain/catalog';
import type { EditionModel } from '../domain/model';
import { EASE, Mono, Reveal, SectionHead, useSeen } from './primitives';

export function NarrativeSection({ model }: { model: EditionModel }) {
  const total = model.houses.length;
  const [themesRef, seen] = useSeen<HTMLUListElement>();
  const order = { upgrade: 0, downgrade: 1, new: 2, dropped: 3 } as const;
  const changes = [...model.changes].sort((a, b) => order[a.kind] - order[b.kind]);
  const ups = changes.filter((c) => c.kind === 'upgrade').length;
  const downs = changes.filter((c) => c.kind === 'downgrade').length;

  return (
    <section className="section section--alt" id="narrative" aria-labelledby="narrative-title">
      <div className="wrap">
        <SectionHead
          id="narrative"
          kicker="06 · Narrative"
          title="What everyone is talking about"
          sub="The themes that run through the outlooks, and the calls that moved since the previous edition."
        />
        <div className="tc">
          <Reveal className="panel">
            <h3>Recurring themes</h3>
            <p>Number of houses that make each theme central to their outlook.</p>
            {model.themes.length ? (
              <ul className="themes" ref={themesRef}>
                {model.themes.map((t, i) => (
                  <li key={t.name}>
                    <div className="t-top">
                      <span>{t.name}</span>
                      <span className="num">
                        {t.houses.length} of {total}
                      </span>
                    </div>
                    <div className="t-bar" aria-hidden="true">
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: seen ? t.houses.length / total : 0 }}
                        transition={{ duration: 1.1, ease: EASE, delay: i * 0.08 }}
                      />
                    </div>
                    <div className="t-houses">
                      {t.houses.map((id) => (
                        <Mono key={id} house={HOUSE_BY_ID[id]} size="sm" />
                      ))}
                      <span className="sr-only">
                        Cited by {t.houses.map((id) => HOUSE_BY_ID[id].name).join(', ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No themes recorded for this edition.</p>
            )}
          </Reveal>
          <Reveal className="panel" delay={0.12}>
            <h3>What changed{model.previous ? ` since ${model.previous.label}` : ''}</h3>
            <p>
              {model.previous
                ? `${ups + downs} call${ups + downs === 1 ? '' : 's'} moved: ${ups} upgrade${ups === 1 ? '' : 's'} and ${downs} downgrade${downs === 1 ? '' : 's'}.`
                : 'This is the first edition in our archive, so there is nothing to compare yet.'}
            </p>
            {model.previous && changes.length > 0 && (
              <ul className="changes">
                <AnimatePresence mode="popLayout">
                  {changes.map((c, i) => {
                    const h = HOUSE_BY_ID[c.house];
                    const a = ASSET_BY_ID[c.asset];
                    const dir =
                      c.kind === 'upgrade' ? 'up' : c.kind === 'downgrade' ? 'down' : 'neutral';
                    const verb = {
                      upgrade: 'upgrades',
                      downgrade: 'downgrades',
                      new: 'adds a view on',
                      dropped: 'drops its view on',
                    }[c.kind];
                    return (
                      <motion.li
                        key={`${model.edition.id}-${c.house}-${c.asset}`}
                        className="change"
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                      >
                        <span className={`arr ${dir}`} aria-hidden="true">
                          {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'}
                        </span>
                        <div>
                          <strong>
                            {h.name} {verb} {a.name}
                          </strong>
                          <span>
                            {c.from.label ?? 'No view'} → {c.to.label ?? 'No view'}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
            {model.previous && changes.length === 0 && (
              <p className="empty">No call changed between editions.</p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
