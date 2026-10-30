/** Node-side loading of edition files (build tooling); the browser uses src/data/editions.ts. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { previousComparable } from '../../src/domain/consensus.ts';
import { buildModel, type EditionModel } from '../../src/domain/model.ts';
import { parseEditions } from '../../src/data/parse.ts';
import type { Edition } from '../../src/domain/schema.ts';

export function loadEditionDirs(dirs: string[]): Edition[] {
  const files: Record<string, unknown> = {};
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith('.json'))
      .sort())
      files[join(dir, f)] = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  }
  const { editions, errors } = parseEditions(files);
  if (errors.length)
    throw new Error(
      `Invalid edition files: ${errors.map((e) => `${e.file}: ${e.message}`).join('; ')}`,
    );
  return editions;
}

export const modelsFor = (editions: Edition[]): EditionModel[] =>
  editions.map((e) => buildModel(e, previousComparable(editions, e)));
