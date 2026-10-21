import { motion } from 'motion/react';
import type { PointerEvent } from 'react';
import { ASSETS } from '../domain/catalog';
import type { EditionModel, HouseRow } from '../domain/model';
import { labelFor } from '../domain/model';
import {
  EASE,
  ExternalLink,
  formatDate,
  Mono,
  Reveal,
  SectionHead,
  stanceClass,
} from './primitives';

function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

function HouseCard({ row, index }: { row: HouseRow; index: number }) {
  const { house, entry } = row;
  const months = Math.max(1, Math.round(row.ageDays / 30));
  const profile = ASSETS.map((a) => ({
    asset: a,
    call: entry.calls.find((c) => c.asset === a.id)!,
  }));
  return (
    <Reveal
      as="article"
      className="house"
      delay={(index % 3) * 0.09}
      style={{ ['--hc' as string]: house.color }}
      onPointerMove={spotlight}
    >
      <div className="h-head">
        <Mono house={house} size="lg" />
        <div>
          <h3>{house.name}</h3>
          <p>{house.team}</p>
        </div>
      </div>
      <div className="h-pub">
        <span>{house.publication}</span>
        <span className="pill">{house.cadence}</span>
      </div>
      <p className="h-date">
        Latest edition {formatDate(entry.source.published)}{' '}
        {row.stale ? (
          <span className="fresh old">{months} months old</span>
        ) : (
          <span className="fresh">Fresh</span>
        )}
      </p>
      <blockquote className="worldview">{entry.worldview}</blockquote>
      <div>
        <div
          className="dna"
          role="img"
          aria-label={`${house.name} profile: ${profile.map((p) => `${p.asset.name} ${labelFor(row, p.call.score, p.call.label)}`).join(', ')}`}
        >
          {profile.map((p, i) => (
            <motion.span
              key={p.asset.id}
              className={stanceClass(p.call.score)}
              title={`${p.asset.name}: ${labelFor(row, p.call.score, p.call.label)}`}
              initial={{ scaleY: 0.1, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.04 }}
            />
          ))}
        </div>
        <div className="dna-lab" aria-hidden="true">
          <span>Equities</span>
          <span>Fixed income</span>
          <span>Real assets · FX</span>
        </div>
      </div>
      <dl className="h-dl">
        <dt>Leans into</dt>
        <dd>
          {row.leans.length
            ? row.leans.map((x) => (
                <span key={x.asset.id} className={`chip ${stanceClass(x.call.score)}`}>
                  {x.asset.name}
                </span>
              ))
            : '—'}
        </dd>
        <dt>Steers clear of</dt>
        <dd>
          {row.avoids.length
            ? row.avoids.map((x) => (
                <span key={x.asset.id} className={`chip ${stanceClass(x.call.score)}`}>
                  {x.asset.name}
                </span>
              ))
            : '—'}
        </dd>
        <dt>Key risk</dt>
        <dd>{entry.keyRisk}</dd>
      </dl>
      <ExternalLink className="h-link" href={entry.source.url}>
        {entry.source.title}
      </ExternalLink>
    </Reveal>
  );
}

export function HousesSection({ model }: { model: EditionModel }) {
  return (
    <section className="section" id="houses" aria-labelledby="houses-title">
      <div className="wrap">
        <SectionHead
          id="houses"
          kicker="05 · Houses"
          title={`${model.houses.length === 5 ? 'Five' : model.houses.length} houses, ${model.houses.length === 5 ? 'five' : model.houses.length} worldviews`}
          sub="One voice per institution: the team that publishes an explicit asset allocation. Each card shows which publication we read and how fresh it is."
        />
        <div className="houses">
          {model.houses.map((row, i) => (
            <HouseCard key={`${model.edition.id}-${row.house.id}`} row={row} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
