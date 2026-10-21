import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { HOUSE_BY_ID } from '../domain/catalog';
import type { ForecastSummary } from '../domain/consensus';
import type { EditionModel } from '../domain/model';
import { CountUp, EASE, Mono, Reveal, SectionHead } from './primitives';

function ForecastCard({
  s,
  index,
  houses,
}: {
  s: ForecastSummary;
  index: number;
  houses: Set<string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });
  const f = s.forecast;
  const num = (v: number) =>
    v.toLocaleString('en-US', {
      minimumFractionDigits: f.decimals,
      maximumFractionDigits: f.decimals,
    });
  const fmt = (v: number) => num(v) + (f.unit ?? '');
  const shown = s.values.filter((v) => houses.has(v.house));

  if (s.median === null || s.low === null || s.high === null) {
    return (
      <Reveal className="f-card" delay={(index % 4) * 0.08}>
        <h3 className="f-name">{f.name}</h3>
        <p className="f-sub">{f.sub}</p>
        <p className="empty">No published forecasts in this edition.</p>
      </Reveal>
    );
  }

  const lo = Math.min(s.low, f.spot ?? Infinity);
  const hi = Math.max(s.high, f.spot ?? -Infinity);
  const pad = (hi - lo) * 0.14 || Math.abs(hi) * 0.05 || 1;
  const X = (v: number) => ((v - (lo - pad)) / (hi + pad - (lo - pad))) * 100;

  // lanes keep close values from overlapping: centre lane, then above, then below
  const lanes: number[][] = [[], [], []];
  const laneY = [0, -24, 24];
  const yOf = new Map<string, number>();
  [...shown]
    .filter((v) => v.value !== null)
    .sort((a, b) => a.value! - b.value!)
    .forEach((v) => {
      const x = X(v.value!);
      const lane = [0, 1, 2].find((l) => lanes[l].every((px) => Math.abs(px - x) >= 11)) ?? 0;
      lanes[lane].push(x);
      yOf.set(v.house, laneY[lane]);
    });

  let delta: string | null = null;
  if (s.delta) {
    const v = s.delta.value;
    const arrow = v > 0 ? '▲ +' : v < 0 ? '▼ −' : '';
    delta = `${arrow}${s.delta.unit === 'bp' ? Math.abs(v) : Math.abs(v).toFixed(1)}${s.delta.unit === 'bp' ? ' bp' : '%'} vs today`;
  } else if (s.low !== s.high) {
    delta = `${num(s.low)}–${fmt(s.high)} range`;
  }

  return (
    <Reveal className="f-card" delay={(index % 4) * 0.08}>
      <div ref={ref}>
        <h3 className="f-name">{f.name}</h3>
        <p className="f-sub">{f.sub}</p>
        <div className="f-big">
          <b className="num">
            <CountUp value={s.median} decimals={f.decimals} />
            {f.unit ?? ''}
          </b>
          {delta && <span className="f-delta">{delta}</span>}
        </div>
        <p className="f-medlab">
          {s.count === 1 ? 'Only one published call' : `Median of ${s.count} published calls`}
        </p>
        <div className="f-strip" aria-hidden="true">
          <span className="f-axis" />
          <motion.span
            className="f-range"
            initial={{ left: `${X(s.median)}%`, width: 0 }}
            animate={
              inView
                ? { left: `${X(s.low)}%`, width: `${X(s.high) - X(s.low)}%` }
                : { left: `${X(s.median)}%`, width: 0 }
            }
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          />
          {f.spot !== null && (
            <motion.span
              className="f-spot"
              initial={false}
              animate={{ left: `${X(f.spot)}%` }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <em>Today {fmt(f.spot)}</em>
            </motion.span>
          )}
          {shown
            .filter((v) => v.value !== null)
            .map((v, i) => (
              <motion.span
                key={v.house}
                className="f-dot"
                initial={{ left: `${X(s.median!)}%`, y: 0, opacity: 0 }}
                animate={
                  inView
                    ? { left: `${X(v.value!)}%`, y: yOf.get(v.house) ?? 0, opacity: 1 }
                    : { left: `${X(s.median!)}%`, y: 0, opacity: 0 }
                }
                transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.08 }}
              >
                <Mono house={HOUSE_BY_ID[v.house]} size="sm" />
              </motion.span>
            ))}
        </div>
        <div className="f-ends num" aria-hidden="true">
          <span>Low {fmt(s.low)}</span>
          <span>High {fmt(s.high)}</span>
        </div>
      </div>
      <ul className="f-vals" aria-label={`${f.name} forecast by house`}>
        {shown.map((v) => {
          const meta = f.values[v.house];
          return (
            <li
              key={v.house}
              className={v.value === null ? 'np' : undefined}
              title={
                meta?.producer
                  ? `${meta.producer}${meta.period ? ` · ${meta.period}` : ''}`
                  : undefined
              }
            >
              <Mono house={HOUSE_BY_ID[v.house]} size="sm" />
              <span className="num">
                <span className="sr-only">{HOUSE_BY_ID[v.house].name}: </span>
                {v.value === null ? 'n/p' : fmt(v.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}

export function NumbersSection({ model }: { model: EditionModel }) {
  if (!model.forecasts.length) return null;
  const houses = new Set<string>(model.houses.map((h) => h.house.id));
  return (
    <section className="section section--alt" id="numbers" aria-labelledby="numbers-title">
      <div className="wrap">
        <SectionHead
          id="numbers"
          kicker="04 · The numbers"
          title="What they expect, in numbers"
          sub="Targets and forecasts from each group's flagship outlooks. The black bar spans the lowest to the highest call; the dashed line is today's level. n/p means not published."
        />
        <div className="fc">
          {model.forecasts.map((s, i) => (
            <ForecastCard key={s.forecast.id} s={s} index={i} houses={houses} />
          ))}
        </div>
      </div>
    </section>
  );
}
