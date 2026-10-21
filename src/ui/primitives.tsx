import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { COMMON_LABEL, SHORT_LABEL, scoreKey, type House, type Score } from '../domain/catalog';
import type { Tone } from '../domain/consensus';

export const EASE = [0.2, 0.8, 0.2, 1] as const;

export const stanceClass = (s: Score | null) =>
  s === null ? 'none' : s >= 2 ? 'ow2' : s === 1 ? 'ow1' : s === 0 ? 'n' : s === -1 ? 'uw1' : 'uw2';
export const shortLabel = (s: Score | null) => (s === null ? '—' : SHORT_LABEL[scoreKey(s)]);
export const commonLabel = (s: Score | null) =>
  s === null ? 'No view' : COMMON_LABEL[scoreKey(s)];
/** Position on the meter track, in percent: -2 → 6%, 0 → 50%, +2 → 94%. */
export const trackPos = (s: number) => 50 + s * 22;

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function Mono({ house, size }: { house: House; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={`mono${size ? ` mono--${size}` : ''}`}
      style={{ ['--hc' as string]: house.color }}
      aria-hidden="true"
    >
      {house.mono}
    </span>
  );
}

export function VerdictPill({ tone, label }: { tone: Tone; label: string }) {
  return <span className={`vpill ${tone}`}>{label}</span>;
}

/** Fade-and-rise when the element first scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
  style,
  onPointerMove,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'article' | 'li';
  style?: CSSProperties;
  onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      style={style}
      onPointerMove={onPointerMove}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** A heading whose words rise into place one after another. */
export function WordReveal({
  text,
  className,
  accent,
}: {
  text: string;
  className?: string;
  accent?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const words = text.split(' ');
  return (
    <span ref={ref} className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden="true"
          className={`w${accent && w.replace(/[.,]/g, '') === accent ? ' accent-word' : ''}`}
          initial={{ opacity: 0, y: '0.6em', filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/** Counts up to `value` once visible, and glides to new values when the edition changes. */
export function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const shown = useRef(0);
  const format = (v: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = format(value);
      shown.current = value;
      return;
    }
    const controls = animate(shown.current, value, {
      duration: shown.current === 0 ? 1.4 : 0.8,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = format(v);
        shown.current = v;
      },
    });
    return () => controls.stop();
  }, [value, decimals, inView, reduce]);
  return (
    <span ref={ref} className={className}>
      {format(reduce ? value : 0)}
    </span>
  );
}

/** Segmented control with a sliding highlight. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
}: {
  label: string;
  options: readonly { id: T; name: string }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.id === value && (
            <motion.span
              layoutId={layoutId}
              className="seg-bg"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span>{o.name}</span>
        </button>
      ))}
    </div>
  );
}

export function SectionHead({
  id,
  kicker,
  title,
  sub,
}: {
  id: string;
  kicker: string;
  title: string;
  sub: ReactNode;
}) {
  return (
    <header className="s-head">
      <Reveal>
        <p className="s-kick">{kicker}</p>
      </Reveal>
      <h2 className="s-title" id={`${id}-title`}>
        <WordReveal text={title} />
      </h2>
      <Reveal delay={0.15}>
        <p className="s-sub">{sub}</p>
      </Reveal>
    </header>
  );
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** True once the element has been on screen; used to trigger CSS entrance animations. */
export function useSeen<T extends Element>(margin = '0px 0px -80px 0px') {
  const ref = useRef<T>(null);
  const inView = useInView(ref, {
    once: true,
    margin: margin as `${number}px ${number}px ${number}px ${number}px`,
  });
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);
  return [ref, seen] as const;
}
