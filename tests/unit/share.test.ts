import { describe, expect, it } from 'vitest';
import { renderCard } from '../../scripts/share/cards.ts';
import { buildModel } from '../../src/domain/model.ts';
import { editionSchema } from '../../src/domain/schema.ts';
import q4 from '../../data/examples/2026-q4.json';

const pngSize = (b: Buffer) => [b.readUInt32BE(16), b.readUInt32BE(20)];

describe('share images', () => {
  it('renders the link card at 1200×630 and the post image at 1080×1350', async () => {
    const model = buildModel(editionSchema.parse(q4), null);
    const og = await renderCard('og', model, 'https://example.github.io/market-view/');
    expect(og.subarray(1, 4).toString()).toBe('PNG');
    expect(pngSize(og)).toEqual([1200, 630]);
    const post = await renderCard('post', model, 'https://example.github.io/market-view/');
    expect(pngSize(post)).toEqual([1080, 1350]);
  }, 30_000);
});
