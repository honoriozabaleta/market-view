import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('private data boundary', () => {
  it('only loads drafts through the drafts-mode alias', () => {
    const config = readFileSync('vite.config.ts', 'utf8');
    expect(config).toContain("drafts ? './src/data/drafts.ts' : './src/data/no-drafts.ts'");
    const loader = readFileSync('src/data/editions.ts', 'utf8');
    expect(loader).not.toMatch(/data\/drafts/);
    expect(loader).toContain("from '@drafts'");
  });
});
