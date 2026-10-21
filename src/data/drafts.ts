/** Only bundled in `--mode drafts` (see vite.config.ts). Never part of a public build. */
const drafts: Record<string, unknown> = import.meta.glob('../../data/drafts/*.json', {
  eager: true,
  import: 'default',
});
export default drafts;
