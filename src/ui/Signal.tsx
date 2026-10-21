import { AnimatePresence, motion } from 'motion/react';
import { bucketOf } from '../domain/consensus';
import type { AssetRow, EditionModel } from '../domain/model';
import { labelFor } from '../domain/model';
import { countsText } from './Consensus';
import { DotTrack } from './DotTrack';
import { EASE, Reveal, SectionHead } from './primitives';

export function SignalSection({ model }: { model: EditionModel }) {
  const described = model.assets.filter((a) => a.stats.verdict.id !== 'insufficient');
  const agree = described
    .filter((a) => a.stats.mode !== 'n')
    .sort(
      (x, y) =>
        y.stats.agreement! - x.stats.agreement! || Math.abs(y.stats.avg!) - Math.abs(x.stats.avg!),
    )
    .slice(0, 3);
  const split = [...described]
    .sort((x, y) => x.stats.agreement! - y.stats.agreement! || y.stats.sd! - x.stats.sd!)
    .slice(0, 3);
  const nameLabel = (r: AssetRow, side: (s: number) => boolean) =>
    r.cells
      .filter((c) => c.call.score !== null && side(c.call.score))
      .map((c) => c.house.name)
      .join(', ') || 'none';

  const item = (r: AssetRow, kind: 'agree' | 'split', i: number) => {
    let text: string;
    if (kind === 'agree') {
      const mode = r.stats.mode!;
      const dissent = r.cells.filter(
        (c) => c.call.score !== null && bucketOf(c.call.score) !== mode,
      );
      text =
        `${r.stats.counts[mode]} of ${r.stats.n} ${mode === 'ow' ? 'overweight' : 'underweight'}. ` +
        (dissent.length
          ? `Dissent: ${dissent
              .map(
                (c) =>
                  `${c.house.name} (${labelFor(
                    model.houses.find((h) => h.house.id === c.house.id)!,
                    c.call.score,
                    c.call.label,
                  )})`,
              )
              .join(', ')}.`
          : 'No dissent.');
    } else {
      text = `Positive: ${nameLabel(r, (s) => s > 0)}. Negative: ${nameLabel(r, (s) => s < 0)}.`;
    }
    return (
      <motion.li
        key={`${model.edition.id}-${r.asset.id}`}
        className="ad-item"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
      >
        <div className="ad-top">
          <strong>{r.asset.name}</strong>
          <span className="num">{countsText(r)}</span>
        </div>
        <DotTrack
          small
          dots={r.cells.map((c) => ({ house: c.house, score: c.call.score }))}
          avg={r.stats.avg}
        />
        <p>{text}</p>
      </motion.li>
    );
  };

  return (
    <section className="section" id="signal" aria-labelledby="signal-title">
      <div className="wrap">
        <SectionHead
          id="signal"
          kicker="03 · Signal"
          title="Agreement and dissent"
          sub="Consensus is useful. Dissent is often more interesting. These are the calls with the most and the least agreement this quarter."
        />
        <div className="ad">
          <Reveal className="ad-card">
            <h3>Where they agree</h3>
            <p>Highest share of houses on the same side of neutral.</p>
            <ul className="ad-list">
              <AnimatePresence mode="popLayout">
                {agree.map((r, i) => item(r, 'agree', i))}
              </AnimatePresence>
            </ul>
          </Reveal>
          <Reveal className="ad-card" delay={0.12}>
            <h3>Where they disagree</h3>
            <p>Houses spread across both sides of neutral.</p>
            <ul className="ad-list">
              <AnimatePresence mode="popLayout">
                {split.map((r, i) => item(r, 'split', i))}
              </AnimatePresence>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
