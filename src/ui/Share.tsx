import { motion } from 'motion/react';
import { useState } from 'react';
import type { EditionModel } from '../domain/model';
import { cardFileName } from '../domain/share';
import { EASE, Reveal } from './primitives';

/** Closing band: download the edition's portrait image or copy the link (which previews itself). */
export function ShareSection({ model }: { model: EditionModel }) {
  const [copied, setCopied] = useState(false);
  const { edition } = model;
  if (edition.status !== 'published') return null;
  const post = `${import.meta.env.BASE_URL}${cardFileName(edition.id, 'post')}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="share" id="share" aria-labelledby="share-title">
      <div className="wrap share-grid">
        <Reveal>
          <p className="s-kick share-kick">08 · Share</p>
          <h2 className="share-title" id="share-title">
            Take the {edition.label} consensus with you
          </h2>
          <p className="share-lead">
            One image with every call of every house, ready for LinkedIn, a deck or a team chat.
            Prefer the link? It shows its own preview card.
          </p>
          <div className="cta">
            <a className="btn btn--primary" href={post} download={`market-view-${edition.id}.png`}>
              Download the image <span aria-hidden="true">↓</span>
            </a>
            <button type="button" className="btn btn--ghost" onClick={copy} aria-live="polite">
              {copied ? 'Link copied ✓' : 'Copy link'}
            </button>
          </div>
        </Reveal>
        <motion.a
          className="share-preview"
          href={post}
          target="_blank"
          rel="noopener"
          initial={{ opacity: 0, y: 40, rotate: 3 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          whileHover={{ rotate: 0, y: -8, scale: 1.02 }}
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <img
            src={post}
            width={1080}
            height={1350}
            loading="lazy"
            alt={`Share image of the Market View ${edition.label} edition: the full grid of calls by house and asset class`}
          />
          <span className="sr-only"> (opens the full-size image in a new tab)</span>
        </motion.a>
      </div>
    </section>
  );
}
