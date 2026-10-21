import { assets } from './catalog';
import { compareInstants, publicationUpperBound, type AssetId } from './schema';
import { comparisonExclusions, defaultCohort } from './selectors';
import type { ResearchInventory, ResearchPackage } from './research';

export function researchCuts(inventory: ResearchInventory) {
  return [
    { id: '2026-Q3', cutoff: '2026-09-30T23:59:59.999Z', nature: 'reconstructed' as const },
    { id: '2026-Q4-to-date', cutoff: inventory.cutoff, nature: 'reconstructed' as const },
  ].filter((c) => compareInstants(c.cutoff, inventory.cutoff) <= 0);
}

export function availableResearchPackets(
  packets: ResearchPackage[],
  cutoff: string,
  knowledgeAt: string,
) {
  return packets.filter(
    (p) =>
      p.publication.publishedDate &&
      compareInstants(publicationUpperBound(p.publication), cutoff) <= 0 &&
      compareInstants(p.provenance.verifiedAt, knowledgeAt) <= 0 &&
      compareInstants(p.provenance.capturedAt, knowledgeAt) <= 0 &&
      compareInstants(p.publication.firstObservedAt, knowledgeAt) <= 0,
  );
}

/** Private extraction diagnostics only. This never grants editorial eligibility. */
export function researchCell(
  inventory: ResearchInventory,
  packets: ResearchPackage[],
  streamId: string,
  assetId: AssetId,
  cutoff: string,
  knowledgeAt: string,
) {
  const available = availableResearchPackets(packets, cutoff, knowledgeAt).filter(
    (p) => p.publication.streamId === streamId,
  );
  const candidates = available.flatMap((p) =>
    p.assets
      .filter((o) => o.assetId === assetId)
      .map((observation) => ({ packet: p, observation })),
  );
  // A partial replacement cannot refresh or erase a different asset.
  const replaced = new Set(
    candidates
      .map(
        (c) =>
          inventory.publications.find((p) => p.id === c.packet.publication.id)
            ?.supersedesPublicationId,
      )
      .filter(Boolean),
  );
  const replacedObservations = new Set(
    candidates.map((c) => c.observation.replacesObservationId).filter(Boolean),
  );
  candidates.sort(
    (a, b) =>
      compareInstants(
        publicationUpperBound(b.packet.publication),
        publicationUpperBound(a.packet.publication),
      ) ||
      compareInstants(b.observation.verifiedAt, a.observation.verifiedAt) ||
      a.observation.id.localeCompare(b.observation.id),
  );
  const current =
    candidates.find(
      (c) => !replaced.has(c.packet.publication.id) && !replacedObservations.has(c.observation.id),
    ) ?? null;
  const stream = inventory.streams.find((s) => s.id === streamId)!;
  const newestKnown = inventory.publications
    .filter(
      (p) =>
        p.streamId === streamId &&
        p.publishedDate &&
        compareInstants(publicationUpperBound(p), cutoff) <= 0 &&
        compareInstants(p.observedAt, knowledgeAt) <= 0,
    )
    .sort((a, b) => compareInstants(publicationUpperBound(b), publicationUpperBound(a)))[0];
  const notRenewed =
    !!current &&
    available.some(
      (p) =>
        compareInstants(
          publicationUpperBound(p.publication),
          publicationUpperBound(current.packet.publication),
        ) > 0,
    );
  const laterUnread =
    !!current &&
    !!newestKnown &&
    newestKnown.access !== 'read' &&
    compareInstants(
      publicationUpperBound(newestKnown),
      publicationUpperBound(current.packet.publication),
    ) > 0;
  const reasons = current
    ? comparisonExclusions(current.observation, defaultCohort(assetId))
    : ['No dated, extracted observation located at this cut'];
  const horizon = current?.packet.assetContexts.find(
    (c) => c.observationId === current.observation.id,
  )?.horizon;
  if (
    horizon?.minMonths !== null &&
    horizon?.minMonths !== undefined &&
    horizon.maxMonths !== null &&
    horizon.minMonths !== horizon.maxMonths
  ) {
    const i = reasons.indexOf('Horizon not disclosed');
    if (i >= 0)
      reasons[i] =
        `Source horizon is an interval (${horizon.minMonths}–${horizon.maxMonths} months), not the exact cohort horizon`;
  }
  if (stream.staleAfterDays === null)
    reasons.push('Source age policy pending owner decision; no assumed threshold');
  else if (
    current &&
    (Date.parse(cutoff) - Date.parse(publicationUpperBound(current.packet.publication))) /
      86400000 >
      stream.staleAfterDays
  )
    reasons.push('Source publication exceeds the documented age policy');
  if (notRenewed)
    reasons.push('A later extracted publication did not renew this asset observation');
  if (current?.observation.status === 'withdrawn')
    reasons.push('Explicit source withdrawal; no prior view carried forward');
  if (laterUnread)
    reasons.push(
      'Later publication not extracted; latest extracted is not a claim of latest institutional view',
    );
  reasons.push(
    'Draft extraction and source usage await human review; excluded from published views and indices',
  );
  return { streamId, assetId, current, notRenewed, laterUnread, reasons };
}

export function researchMatrix(
  inventory: ResearchInventory,
  packets: ResearchPackage[],
  cutoff: string,
  knowledgeAt: string,
) {
  return inventory.streams
    .filter((s) => s.defaultForInstitution)
    .flatMap((s) =>
      assets.map((a) => researchCell(inventory, packets, s.id, a.id, cutoff, knowledgeAt)),
    );
}

export function researchTimeline(inventory: ResearchInventory, packets: ResearchPackage[]) {
  return inventory.publications
    .slice()
    .sort((a, b) => {
      if (!a.publishedDate) return b.publishedDate ? 1 : a.id.localeCompare(b.id);
      if (!b.publishedDate) return -1;
      return (
        compareInstants(publicationUpperBound(a), publicationUpperBound(b)) ||
        compareInstants(a.observedAt, b.observedAt) ||
        a.id.localeCompare(b.id)
      );
    })
    .flatMap((p) => {
      const packet = packets.find((x) => x.publication.id === p.id);
      return assets.map((a) => {
        const observation = packet?.assets.find((o) => o.assetId === a.id);
        const audit = packet?.assetAudit.find((x) => x.assetId === a.id);
        return {
          publication: p,
          assetId: a.id,
          observation,
          event:
            p.revisionKind === 'extraction_correction'
              ? 'Extraction correction; not an institutional view change'
              : !packet
                ? 'Not extracted; no omission or stance inferred'
                : observation?.revisionKind === 'extraction_correction'
                  ? 'Extraction correction; not an institutional view change'
                  : observation?.status === 'withdrawn'
                    ? 'Explicit source withdrawal'
                    : observation
                      ? 'Explicit extracted statement; comparison/classification pending review'
                      : audit?.status === 'not_discussed'
                        ? 'Omission in this publication; no neutral or reaffirmed view inferred'
                        : 'Extraction unresolved',
        };
      });
    });
}
