import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import template from '../../templates/publication-draft.json';
const id = `test-import-${process.pid}`;
const input = `.local/${id}.json`;
const output = `data/drafts/${id}.json`;
const invalid = `.local/${id}-invalid.json`;
const run = (path: string) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'scripts/import-draft.ts', path], {
    encoding: 'utf8',
  });
afterAll(() => {
  for (const path of [input, output, invalid]) {
    try {
      unlinkSync(path);
    } catch {
      /* absent is fine */
    }
  }
});
describe('local draft import command', () => {
  it('validates a draft and leaves it pending outside published data', () => {
    mkdirSync('.local', { recursive: true });
    writeFileSync(input, JSON.stringify(template));
    const result = run(input);
    expect(result.status, result.stderr).toBe(0);
    const draft = JSON.parse(readFileSync(output, 'utf8'));
    expect(draft.mode).toBe('draft');
    expect(draft.reviews[0].status).toBe('pending');
    expect(draft.observations[0].firstPublishedAt).toBeNull();
  });
  it('refuses to overwrite an imported draft', () => {
    const result = run(input);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('EEXIST');
  });
  it('reports a useful field path for unsafe input URLs', () => {
    const data = {
      ...structuredClone(template),
      publications: [{ ...template.publications[0], officialUrl: 'javascript:alert(1)' }],
    };
    writeFileSync(invalid, JSON.stringify(data));
    const result = run(invalid);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('publications.0.officialUrl');
  });
});
