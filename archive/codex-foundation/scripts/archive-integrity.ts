import type { Dataset } from '../src/domain/schema';
/** Closed snapshots and their evidence contracts are append-only across repository revisions. */
export function assertArchiveIntegrity(before: Dataset, after: Dataset) {
  const same = (a: unknown, b: unknown, label: string) => {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`Immutable archive changed: ${label}. Append a new identified revision.`);
  };
  for (const snapshot of before.snapshots) {
    same(
      snapshot,
      after.snapshots.find((x) => x.id === snapshot.id),
      snapshot.id,
    );
    for (const entry of snapshot.entries) {
      const oldObservation = before.observations.find((o) => o.id === entry.observationId)!;
      same(
        oldObservation,
        after.observations.find((o) => o.id === entry.observationId),
        entry.observationId,
      );
      same(
        before.publications.find((p) => p.id === entry.publicationId),
        after.publications.find((p) => p.id === entry.publicationId),
        entry.publicationId,
      );
      same(
        before.reviews.find((r) => r.observationId === entry.observationId),
        after.reviews.find((r) => r.observationId === entry.observationId),
        `${entry.observationId} review`,
      );
      if (oldObservation.mappingRuleId)
        same(
          before.mappings.find((m) => m.id === oldObservation.mappingRuleId),
          after.mappings.find((m) => m.id === oldObservation.mappingRuleId),
          oldObservation.mappingRuleId,
        );
      const publication = before.publications.find((p) => p.id === entry.publicationId)!;
      const stream = before.streams.find((s) => s.id === publication.streamId)!;
      same(
        stream,
        after.streams.find((s) => s.id === stream.id),
        stream.id,
      );
      same(
        before.sources.find((s) => s.id === stream.sourceId),
        after.sources.find((s) => s.id === stream.sourceId),
        stream.sourceId,
      );
      same(
        before.institutions.find((i) => i.id === stream.institutionId),
        after.institutions.find((i) => i.id === stream.institutionId),
        stream.institutionId,
      );
    }
  }
}
