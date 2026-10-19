import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dataset } from '../data/load';
import { comparisonHorizon, DateLabel, EmptyState } from './components';
import { initialFilters, type Filters } from './Filters';
import { now } from './clock';
import { Latest } from './pages/Latest';
import { Institutions } from './pages/Institutions';
import { Archive } from './pages/Archive';
import { ObservationDetail } from './pages/ObservationDetail';
import { Methodology } from './pages/Methodology';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
function getRoute() {
  return window.location.hash.slice(1) || '/latest';
}
const navigation = [
  ['latest', 'Latest Views'],
  ['institutions', 'Institutions'],
  ['archive', 'Quarterly Archive'],
  ['methodology', 'Methodology & Sources'],
] as const;

export function App() {
  const route = useSyncExternalStore(subscribe, getRoute);
  const [path, search = ''] = route.split('?');
  const mainRef = useRef<HTMLElement>(null);
  // Last handled route: an unchanged route (first mount, StrictMode re-run) never moves focus.
  const lastRoute = useRef<string | null>(null);
  // Comparison filters live here so they survive navigation to detail, archive and back.
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const section = path.split('/')[1];
  const subsection = path.split('/')[2];
  useEffect(() => {
    if (lastRoute.current === route) return;
    const initial = lastRoute.current === null;
    lastRoute.current = route;
    const params = new URLSearchParams(search);
    const horizon = comparisonHorizon(params);
    if (params.has('horizon') && horizon !== null)
      setFilters((current) => (current.horizon === horizon ? current : { ...current, horizon }));
    const target =
      section === 'methodology' && subsection
        ? document.getElementById(`method-${subsection}`)
        : null;
    if (initial) {
      target?.scrollIntoView();
      return;
    }
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView();
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [route, section, subsection, search]);
  return (
    <>
      <a
        className="skip-link"
        tabIndex={0}
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      {__DEMO__ && (
        <div className="demo-banner" role="note">
          <span className="demo-tag" aria-hidden="true">
            Demo
          </span>
          <strong>Demo data — not actual institutional views</strong>{' '}
          <span className="demo-clock">
            · Frozen demo clock: <DateLabel value={now} />
          </span>
        </div>
      )}
      <header className="app-header">
        <div className="app-header-inner">
          <a href="#/latest" className="brand">
            <span className="brand-mark" aria-hidden="true">
              MV
            </span>
            <span className="brand-name">Market View</span>
          </a>
          <span className="brand-tagline">Independent research coverage</span>
          <nav className="main-nav" aria-label="Main navigation">
            {navigation.map(([id, title]) => (
              <a key={id} href={`#/${id}`} aria-current={section === id ? 'page' : undefined}>
                {title}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {section === 'latest' ? (
          <Latest filters={filters} onFiltersChange={setFilters} />
        ) : section === 'institutions' ? (
          <Institutions id={subsection} />
        ) : section === 'archive' ? (
          <Archive
            params={new URLSearchParams(search)}
            filters={filters}
            onFiltersChange={setFilters}
          />
        ) : ['observations', 'evidence'].includes(section) ? (
          <ObservationDetail
            id={subsection}
            params={new URLSearchParams(search)}
            evidenceOnly={section === 'evidence'}
          />
        ) : section === 'methodology' ? (
          <Methodology />
        ) : (
          <EmptyState title="Page not found">
            Use the navigation to return to covered research.
          </EmptyState>
        )}
      </main>
      <footer className="app-footer">
        <p>
          Independent personal project · Coverage is curated, not real time · Methodology{' '}
          {dataset.methodologyVersion}. No affiliation with covered institutions. Research
          comparison is not personalized investment advice.
        </p>
        <p>
          <a href="#/methodology/limitations">Limitations</a> ·{' '}
          <a href="#/methodology/sources">Source usage</a>
        </p>
      </footer>
    </>
  );
}
