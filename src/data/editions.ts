import drafts from '@drafts';
import { editionSchema, type Edition } from '../domain/schema';

/** Every edition file in data/editions, plus local drafts when running in drafts mode. */
const published = import.meta.glob('../../data/editions/*.json', {
  eager: true,
  import: 'default',
});

export interface LoadedEditions {
  editions: Edition[];
  errors: { file: string; message: string }[];
}

export function parseEditions(files: Record<string, unknown>): LoadedEditions {
  const byId = new Map<string, Edition>();
  const errors: LoadedEditions['errors'] = [];
  for (const [file, raw] of Object.entries(files)) {
    const parsed = editionSchema.safeParse(raw);
    if (parsed.success) byId.set(parsed.data.id, parsed.data);
    else
      errors.push({
        file: file.split('/').pop() ?? file,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
  }
  return { editions: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)), errors };
}

// Drafts come last so a local draft replaces the edition with the same id.
export const loaded = parseEditions({ ...published, ...drafts });
