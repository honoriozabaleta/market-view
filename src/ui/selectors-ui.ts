// Presentation convenience only. Financial rules live in domain/selectors.ts.
export * from '../domain/selectors';
import { publicationUpperBound, type Dataset, type Observation } from '../domain/schema';
export function publicationUpperBoundForUI(data: Dataset, observation: Observation) {
  return publicationUpperBound(data.publications.find((p) => p.id === observation.publicationId)!);
}
