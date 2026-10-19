import { expect, it } from 'vitest';
import { build } from 'vite';
import { writeFile, unlink } from 'node:fs/promises';
it('inspects a real published build with a private draft canary present and rejects attempted imports', async () => {
  const path = 'data/drafts/test-build-canary.txt';
  await writeFile(path, 'DRAFT_DO_NOT_BUNDLE', { flag: 'wx' });
  try {
    const output = await build({ mode: 'production', logLevel: 'silent', build: { write: false } });
    const artifact = (Array.isArray(output) ? output : [output])
      .flatMap((o) => ('output' in o ? o.output : []))
      .map((o) => (o.type === 'chunk' ? o.code : String(o.source)))
      .join('\n');
    expect(artifact).not.toContain('DRAFT_DO_NOT_BUNDLE');
    expect(artifact).not.toContain('Paper Moon Fictional Asset Management');
    expect(artifact).not.toContain('Research candidates only. No approved coverage');
    await expect(
      build({
        mode: 'production',
        logLevel: 'silent',
        build: { write: false },
        plugins: [
          {
            name: 'attempt-private-import',
            transform(code, id) {
              if (id.replaceAll('\\', '/').endsWith('/src/main.tsx'))
                return `import '../data/drafts/test-build-canary.txt';\n${code}`;
            },
          },
        ],
      }),
    ).rejects.toThrow(/Unpublished/);
  } finally {
    await unlink(path);
  }
}, 30_000);
