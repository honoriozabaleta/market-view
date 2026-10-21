import { MotionConfig } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { loaded } from '../data/editions';
import { previousComparable } from '../domain/consensus';
import { buildModel } from '../domain/model';
import type { Edition } from '../domain/schema';
import { ConsensusSection, type OpenDetail } from './Consensus';
import { Drawer, type DrawerTarget } from './Drawer';
import { GridSection } from './Grid';
import { Header } from './Header';
import { EditorNote, Hero, Ticker } from './Hero';
import { HousesSection } from './Houses';
import { MethodSection } from './Method';
import { NarrativeSection } from './Narrative';
import { NumbersSection } from './Numbers';
import { SignalSection } from './Signal';

function Page({ editions, errors }: { editions: Edition[]; errors: typeof loaded.errors }) {
  const [editionId, setEditionId] = useState(editions[editions.length - 1].id);
  const [target, setTarget] = useState<DrawerTarget | null>(null);
  const edition = editions.find((e) => e.id === editionId)!;
  const model = useMemo(
    () => buildModel(edition, previousComparable(editions, edition)),
    [edition, editions],
  );
  const open: OpenDetail = useCallback(
    (asset, house, trigger) => setTarget({ asset, house, trigger }),
    [],
  );
  const close = useCallback(() => setTarget(null), []);

  return (
    <>
      <Header editions={editions} edition={edition} onEdition={setEditionId} />
      {errors.length > 0 && (
        <div className="load-errors" role="alert">
          Some edition files could not be read:{' '}
          {errors.map((e) => `${e.file} (${e.message})`).join(' · ')}
        </div>
      )}
      <main id="main">
        <Hero model={model} />
        <Ticker model={model} />
        <EditorNote model={model} />
        <ConsensusSection model={model} onOpen={open} />
        <GridSection model={model} onOpen={open} />
        <SignalSection model={model} />
        <NumbersSection model={model} />
        <HousesSection model={model} />
        <NarrativeSection model={model} />
        <MethodSection model={model} />
      </main>
      <footer>
        <div className="wrap">
          <span>Market View · An independent research project</span>
          <span>Not investment advice · No affiliation with the institutions shown</span>
        </div>
      </footer>
      <Drawer model={model} target={target} onClose={close} />
    </>
  );
}

export function App() {
  const { editions, errors } = loaded;
  return (
    <MotionConfig reducedMotion="user">
      {editions.length ? (
        <Page editions={editions} errors={errors} />
      ) : (
        <main className="wrap section">
          <h1>Market View</h1>
          <p className="s-sub">
            No edition could be loaded. {errors.map((e) => `${e.file}: ${e.message}`).join(' · ')}
          </p>
        </main>
      )}
    </MotionConfig>
  );
}
