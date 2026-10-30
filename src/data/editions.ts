import drafts from '@drafts';
import { parseEditions } from './parse';

export { parseEditions, type LoadedEditions } from './parse';

/** Every edition file in data/editions, plus local drafts when running in drafts mode. */
const published = import.meta.glob('../../data/editions/*.json', {
  eager: true,
  import: 'default',
});

// Drafts come last so a local draft replaces the edition with the same id.
export const loaded = parseEditions({ ...published, ...drafts });
