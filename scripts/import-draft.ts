import { mkdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { readDataset } from './validate';
const input = process.argv[2];
if (!input) throw new Error('Usage: npm run import:draft -- path/to/publication.json');
const data = await readDataset(input);
if (
  data.mode !== 'draft' ||
  data.publications.length !== 1 ||
  data.publications.some((p) => p.editorialState !== 'draft' || p.marketViewPublishedAt !== null) ||
  data.reviews.some((r) => r.status !== 'pending' || r.reviewer !== null || r.at !== null) ||
  data.observations.some((o) => o.firstPublishedAt !== null) ||
  data.snapshots.length
)
  throw new Error(
    'Import requires one draft publication, pending reviews, no public release dates or snapshots. Import never approves records.',
  );
const name = basename(input, '.json');
if (!/^[a-z0-9][a-z0-9-]*$/.test(name))
  throw new Error('Filename must use lowercase letters, digits and hyphens');
await mkdir('data/drafts', { recursive: true });
const output = `data/drafts/${name}.json`;
await writeFile(output, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
console.log(
  `Validated draft saved to ${output}; ignored by Git and excluded from every app build. Owner review is still required.`,
);
