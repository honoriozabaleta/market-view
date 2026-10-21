import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../../src/data/load', async () => {
  const { default: raw } = await import('../../data/demo/dataset.json');
  const { DatasetSchema } = await import('../../src/domain/schema');
  return { dataset: DatasetSchema.parse(raw) };
});
vi.mock('../../src/ui/clock', () => ({ now: '2026-05-20T23:59:59Z' }));

import { dataset } from '../../src/data/load';
import { Archive } from '../../src/ui/pages/Archive';
import { InstantLabel } from '../../src/ui/components';
import { initialFilters } from '../../src/ui/Filters';

const snapshotCount = dataset.snapshots.length;
afterEach(() => {
  dataset.snapshots.splice(snapshotCount);
});

it('rejects a direct archive URL for a snapshot not yet created at the query clock', () => {
  dataset.snapshots.push({
    ...structuredClone(dataset.snapshots[0]),
    id: 'test-future-snapshot',
    nature: 'reconstructed',
    createdAt: '2026-05-30T12:00:00Z',
  });
  const markup = renderToStaticMarkup(
    createElement(Archive, {
      params: new URLSearchParams({ cut: 'test-future-snapshot' }),
      filters: initialFilters,
      onFiltersChange: () => {},
    }),
  );
  expect(markup).toContain('Unknown archive cut');
  expect(markup).not.toContain('2026-05-30');
  expect(markup).not.toContain('Comparison at this cut');
});

it('keeps fractional seconds when a cutoff is presented as an exact UTC instant', () => {
  const markup = renderToStaticMarkup(
    createElement(InstantLabel, { value: '2026-05-20T12:30:00.123Z' }),
  );
  expect(markup).toContain('12:30:00.123 UTC');
});
