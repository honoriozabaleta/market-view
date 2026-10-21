import { motion, useScroll, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import type { Edition } from '../domain/schema';

export const SECTIONS = [
  { id: 'consensus', name: 'Consensus' },
  { id: 'grid', name: 'Full grid' },
  { id: 'numbers', name: 'The numbers' },
  { id: 'houses', name: 'Houses' },
  { id: 'narrative', name: 'Themes' },
  { id: 'method', name: 'Method' },
] as const;

function Notice({ edition }: { edition: Edition }) {
  if (edition.status === 'published') return null;
  if (edition.status === 'draft')
    return (
      <div className="notice notice--draft" role="note">
        Private draft · <strong>Real sources, not yet reviewed — do not share</strong>
      </div>
    );
  return (
    <div className="notice" role="note">
      Design preview · <strong>Illustrative data — not actual institutional views</strong>
    </div>
  );
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return active;
}

export function Header({
  editions,
  edition,
  onEdition,
}: {
  editions: Edition[];
  edition: Edition;
  onEdition: (id: string) => void;
}) {
  const active = useActiveSection();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  const recent = editions.slice(-4);

  return (
    <div className="top">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Notice edition={edition} />
      <nav className="nav" aria-label="Primary">
        <div className="wrap nav-in">
          <a className="brand" href="#top" aria-label="Market View, back to top">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="#fff" />
              <rect x="6" y="15" width="4" height="7" rx="1.5" fill="#C23E2B" />
              <rect x="12" y="11" width="4" height="11" rx="1.5" fill="#B4AC9B" />
              <rect x="18" y="6" width="4" height="16" rx="1.5" fill="#0B7A5A" />
            </svg>
            Market View
          </a>
          <div className="links">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'active' : undefined}>
                {s.name}
              </a>
            ))}
          </div>
          <div className="edition-switch" role="group" aria-label="Edition">
            {recent.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === edition.id}
                onClick={() => onEdition(e.id)}
              >
                {e.id === edition.id && (
                  <motion.span
                    layoutId="edition-pill"
                    className="pill-bg"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
        <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
      </nav>
    </div>
  );
}
