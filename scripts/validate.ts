/**
 * Validates every edition file. Usage:
 *   npm run validate              -> data/editions (public) and data/examples (illustrative, tests only)
 *   npm run validate -- --drafts  -> also data/drafts (private, local)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { editionSchema } from '../src/domain/schema';
import { consensusOf } from '../src/domain/consensus';

const dirs = [
  'data/editions',
  'data/examples',
  ...(process.argv.includes('--drafts') ? ['data/drafts'] : []),
];
let failed = false;
const publicStatuses = new Set<string>();

for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const path = join(dir, file);
    const parsed = editionSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    if (!parsed.success) {
      failed = true;
      console.error(`✗ ${path}`);
      for (const issue of parsed.error.issues)
        console.error(`   ${issue.path.join('.')}: ${issue.message}`);
      continue;
    }
    const e = parsed.data;
    if (dir === 'data/editions' && e.status === 'draft') {
      failed = true;
      console.error(`✗ ${path}: drafts belong in data/drafts until the owner reviews them`);
      continue;
    }
    if (dir === 'data/examples' && e.status !== 'illustrative') {
      failed = true;
      console.error(`✗ ${path}: data/examples only holds illustrative editions`);
      continue;
    }
    if (dir === 'data/editions') publicStatuses.add(e.status);
    if (`${e.id}.json` !== file) {
      failed = true;
      console.error(`✗ ${path}: file name must match the edition id (${e.id}.json)`);
      continue;
    }
    const explicit = e.houses.flatMap((h) => h.calls).filter((c) => c.score !== null).length;
    const thin = e.houses.length
      ? [...new Set(e.houses.flatMap((h) => h.calls.map((c) => c.asset)))].filter(
          (a) =>
            consensusOf(e.houses.map((h) => h.calls.find((c) => c.asset === a)!.score)).verdict
              .id === 'insufficient',
        )
      : [];
    console.log(
      `✓ ${path}  ${e.label} · ${e.status} · ${e.houses.length} houses · ${explicit} explicit calls · ${e.forecasts.length} forecasts` +
        (thin.length ? ` · too few views: ${thin.join(', ')}` : ''),
    );
  }
}
if (publicStatuses.has('published') && publicStatuses.has('illustrative')) {
  failed = true;
  console.error(
    '✗ data/editions mixes illustrative and published editions: move examples to data/examples',
  );
}
if (failed) process.exit(1);
