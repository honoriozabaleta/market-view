import { readFile, readdir } from 'node:fs/promises';
import { DatasetSchema, OfficialUrlSchema } from '../src/domain/schema';
import { execFileSync } from 'node:child_process';
import { assertArchiveIntegrity } from './archive-integrity';
import { ResearchInventorySchema } from '../src/domain/research';
import { loadResearchWorkspace, readResearchJson } from './research-workspace';

export async function readDataset(path: string) {
  const result = DatasetSchema.safeParse(JSON.parse(await readFile(path, 'utf8')));
  if (!result.success)
    throw new Error(
      `${path}\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  return result.data;
}
export async function validateAll() {
  for (const path of [
    'data/published/dataset.json',
    'data/demo/dataset.json',
    ...(await readdir('data/drafts'))
      .filter((p) => p.endsWith('.json'))
      .map((p) => `data/drafts/${p}`),
  ]) {
    const data = await readDataset(path);
    const expected = path.includes('/demo/')
      ? 'demo'
      : path.includes('/drafts/')
        ? 'draft'
        : 'published';
    if (data.mode !== expected) throw new Error(`${path}: expected ${expected} mode`);
    if (expected !== 'draft') {
      const requestedRef = process.env.ARCHIVE_BASE_REF || 'HEAD';
      const ref = /^0+$/.test(requestedRef) ? 'HEAD' : requestedRef;
      if (!/^[a-zA-Z0-9/_.-]+$/.test(ref)) throw new Error('Invalid archive baseline ref');
      const exists = execFileSync('git', ['ls-tree', ref, '--', path], { encoding: 'utf8' }).trim();
      if (exists) {
        const previous = DatasetSchema.parse(
          JSON.parse(execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' })),
        );
        assertArchiveIntegrity(previous, data);
      }
    }
    console.log(`Valid: ${path} (${data.observations.length} observations)`);
  }
  const registry = JSON.parse(await readFile('data/candidates/registry.json', 'utf8')) as {
    candidates: { status: string; verifiedUrl: string | null }[];
  };
  for (const candidate of registry.candidates) {
    if (candidate.status !== 'pending_review')
      throw new Error('Candidate registry cannot claim approval');
    if (candidate.verifiedUrl) OfficialUrlSchema.parse(candidate.verifiedUrl);
  }
  console.log('Valid: candidate registry (not bundled)');
  await readResearchJson('data/candidates/research-pilot.json', ResearchInventorySchema);
  console.log('Valid: research pilot bibliography (not approved coverage; not bundled)');
  let privateWorkspaceExists = true;
  try {
    await readFile('.local/research-pilot/inventory.json', 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    privateWorkspaceExists = false;
  }
  if (privateWorkspaceExists) {
    const { packets } = await loadResearchWorkspace('.local/research-pilot');
    console.log(
      `Valid: private research workspace (${packets.length} pending packages; local only)`,
    );
  } else {
    console.log('Private research workspace absent; real drafts are intentionally not in Git.');
  }
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n');
  if (
    tracked.some(
      (p) =>
        /^(?:data\/drafts\/(?!\.gitkeep)|\.local\/|\.env(?:\.|$))/.test(p) && p !== '.env.example',
    )
  )
    throw new Error('Private working files are tracked by Git');
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validate.ts')) await validateAll();
