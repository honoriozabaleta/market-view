import { editionSchema, type Edition } from '../domain/schema.ts';

export interface LoadedEditions {
  editions: Edition[];
  errors: { file: string; message: string }[];
}

/** Validates raw edition files; later files replace earlier ones with the same id. */
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
