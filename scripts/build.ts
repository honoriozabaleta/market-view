import { build } from 'vite';
import { readdir, readFile } from 'node:fs/promises';
import { readDataset } from './validate';

const data = await readDataset('data/published/dataset.json');
if (data.mode !== 'published') throw new Error('Production build requires published dataset');
await build({ mode: 'production' });
async function files(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      ),
    )
  ).flat();
}
const artifact = (await Promise.all((await files('dist')).map((p) => readFile(p, 'utf8')))).join(
  '\n',
);
// Defense in depth: module graph is also checked by Vite before emitting the bundle.
const demo = JSON.parse(await readFile('data/demo/dataset.json', 'utf8')) as {
  institutions: { name: string; id: string }[];
};
const forbidden = [
  ...demo.institutions.flatMap((x) => [x.name, x.id]),
  'demo-paper-q1',
  'DRAFT_DO_NOT_BUNDLE',
  'data/drafts',
  'data/demo',
  'Research candidates only. No approved coverage',
];
for (const term of forbidden)
  if (artifact.includes(term)) throw new Error(`Unpublished data detected in artifact: ${term}`);
console.log(
  'Production artifact inspected: no demo identities, fixture IDs, draft canary or candidate registry.',
);
