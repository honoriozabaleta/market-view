import { AnimatePresence, motion, useInView } from 'motion/react';
import { useRef } from 'react';
import type { House, HouseId, Score } from '../domain/catalog';
import { trackPos, useMediaQuery } from './primitives';

export interface TrackDot {
  house: House;
  score: Score | null;
  /** Previous edition's score, when the call moved. */
  from?: Score | null;
}

const TICKS = [6, 28, 50, 72, 94];
// Always give motion an explicit target: inside AnimatePresence initial={false}, `initial` is skipped.
const HIDDEN = { left: '50%', x: 0, y: 0, scale: 0.3, opacity: 0 };

/**
 * The consensus track: one dot per house on the five-step scale.
 * Dots glide to new positions when the edition changes; ghosts mark where moved calls came from.
 */
export function DotTrack({
  dots,
  avg,
  small,
  highlight,
  showMoves,
}: {
  dots: TrackDot[];
  avg: number | null;
  small?: boolean;
  highlight?: HouseId | null;
  showMoves?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const compact = useMediaQuery('(max-width: 600px)');

  const placed = dots.filter((d) => d.score !== null);
  const groups = new Map<number, TrackDot[]>();
  placed.forEach((d) => groups.set(d.score!, [...(groups.get(d.score!) ?? []), d]));
  const offset = (d: TrackDot) => {
    const g = groups.get(d.score!)!;
    const k = g.indexOf(d);
    if (!compact) return { x: (k - (g.length - 1) / 2) * (small ? 21 : 27), y: 0 };
    // two-row cluster on narrow screens
    const cols = Math.ceil(g.length / 2);
    const lastAlone = g.length % 2 === 1 && k === g.length - 1;
    return {
      x: (Math.floor(k / 2) - (cols - 1) / 2) * 18,
      y: g.length === 1 || lastAlone ? 0 : ((k % 2) - 0.5) * 22,
    };
  };
  const moved = showMoves
    ? placed.filter((d) => d.from !== undefined && d.from !== null && d.from !== d.score)
    : [];

  return (
    <span ref={ref} className={`m-track${small ? ' m-track--sm' : ''}`} aria-hidden="true">
      {TICKS.map((p) => (
        <span key={p} className={`m-tick${p === 50 ? ' c' : ''}`} style={{ left: `${p}%` }} />
      ))}
      <AnimatePresence>
        {moved.map((d) => {
          const a = trackPos(d.from!);
          const b = trackPos(d.score!);
          return (
            <motion.span
              key={`trail-${d.house.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="m-trail"
                style={{
                  left: `${Math.min(a, b)}%`,
                  width: `${Math.abs(b - a)}%`,
                  originX: b > a ? 0 : 1,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              <span
                className="m-ghost"
                style={{ left: `${a}%`, ['--hc' as string]: d.house.color }}
              />
            </motion.span>
          );
        })}
      </AnimatePresence>
      {placed.map((d, i) => {
        const o = offset(d);
        const dim = !!highlight && highlight !== d.house.id;
        return (
          <motion.span
            key={d.house.id}
            className="m-dot"
            style={{ ['--hc' as string]: d.house.color }}
            initial={HIDDEN}
            animate={
              inView
                ? {
                    left: `${trackPos(d.score!)}%`,
                    x: o.x,
                    y: o.y,
                    scale: highlight === d.house.id ? 1.18 : 1,
                    opacity: dim ? 0.15 : 1,
                  }
                : HIDDEN
            }
            transition={{ type: 'spring', stiffness: 110, damping: 17, delay: i * 0.07 }}
          >
            {d.house.mono}
          </motion.span>
        );
      })}
      {avg !== null && (
        <motion.span
          className="m-avg"
          initial={{ left: '50%', opacity: 0 }}
          animate={inView ? { left: `${trackPos(avg)}%`, opacity: 1 } : { left: '50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.35 }}
        />
      )}
    </span>
  );
}
