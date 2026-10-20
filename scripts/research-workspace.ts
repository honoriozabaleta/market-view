import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, join, isAbsolute } from 'node:path';
import { z } from 'zod';
import {
  ResearchInventorySchema,
  ResearchPackageSchema,
  validateResearchSet,
  type ResearchPackage,
} from '../src/domain/research';
import {
  availableResearchPackets,
  researchCuts,
  researchMatrix,
  researchTimeline,
} from '../src/domain/research-selectors';
import { assets } from '../src/domain/catalog';
import type { Publication } from '../src/domain/schema';

export async function readResearchJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(JSON.parse(await readFile(path, 'utf8')));
  if (!result.success)
    throw new Error(
      `${path}\n${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  return result.data;
}
export async function assertPrivatePath(path: string) {
  const target = resolve(path);
  const roots = [resolve('.local'), resolve('data/drafts')];
  const within = (root: string, p: string) => {
    const rel = relative(root, p);
    return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..\\`) && !rel.startsWith('../');
  };
  if (!roots.some((r) => within(r, target)))
    throw new Error('Research work must stay under .local/ or data/drafts/');
  let ancestor = target;
  while (true) {
    try {
      await stat(ancestor);
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      ancestor = dirname(ancestor);
    }
  }
  const resolvedAncestor = await realpath(ancestor);
  const project = await realpath('.');
  if (!within(project, resolvedAncestor))
    throw new Error('Private path resolves outside the repository');
  const canonicalTarget = resolve(resolvedAncestor, relative(ancestor, target));
  if (
    ![join(project, '.local'), join(project, 'data/drafts')].some((root) =>
      within(root, canonicalTarget),
    )
  )
    throw new Error('Private path resolves outside private storage');
  for (const root of roots) {
    try {
      if (!within(project, await realpath(root)))
        throw new Error('Private root resolves outside the repository');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
  return target;
}
export async function loadResearchWorkspace(workspace: string) {
  await assertPrivatePath(workspace);
  const inventory = await readResearchJson(
    join(workspace, 'inventory.json'),
    ResearchInventorySchema,
  );
  const files = (await readdir(join(workspace, 'packages'), { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name)
    .sort();
  const packets = await Promise.all(
    files.map((file) => readResearchJson(join(workspace, 'packages', file), ResearchPackageSchema)),
  );
  validateResearchSet(inventory, packets);
  return { inventory, packets };
}
export async function importResearchPackage(input: string, workspace: string) {
  const packet = await readResearchJson(input, ResearchPackageSchema);
  const inventory = await readResearchJson(
    join(workspace, 'inventory.json'),
    ResearchInventorySchema,
  );
  // Validate the referenced item without requiring all other read packages during incremental import.
  validateResearchSet(
    {
      ...inventory,
      publications: inventory.publications.map((p) =>
        p.id === packet.publication.id ? p : { ...p, access: 'metadata_only' as const },
      ),
    },
    [packet],
  );
  const directory = await assertPrivatePath(join(workspace, 'packages'));
  await mkdir(directory, { recursive: true });
  const output = join(directory, `${packet.publication.id}.json`);
  await writeFile(output, JSON.stringify(packet, null, 2) + '\n', { flag: 'wx' });
  return output;
}
// Source strings stay text in Markdown, including HTML-looking strings and table separators.
const text = (value: unknown) =>
  String(value ?? 'Unknown')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/[\\`*_[\]{}|]/g, '\\$&')
    .replaceAll('\r', '')
    .replaceAll('\n', ' ');
const evidence = (e: { citation: string; locator: string }) =>
  `${text(e.citation)} — ${text(e.locator)}`;
const source = (url: string) =>
  `[Official source](<${url.replace(/[<>]/g, (c) => encodeURIComponent(c))}>)`;
const publicationDate = (p?: Pick<Publication, 'publishedDate' | 'datePrecision'>) =>
  !p?.publishedDate
    ? 'Unknown'
    : p.datePrecision === 'month'
      ? `${p.publishedDate.slice(0, 7)} (month precision)`
      : p.publishedDate;
function packetMarkdown(p: ResearchPackage) {
  const lines = [
    `# ${text(p.publication.title)}`,
    '',
    '**PRIVATE DRAFT — extraction and source usage have not been approved.**',
    '',
    source(p.provenance.sourceUrl),
    '',
    `Publication: ${text(p.publication.publishedDate)} (${p.publication.datePrecision}). Version: ${text(p.publication.version)}.`,
    `First observed: ${p.publication.firstObservedAt}. Captured: ${p.provenance.capturedAt}. Verified: ${p.provenance.verifiedAt}.`,
    `Capture: ${p.provenance.captureKind}. Fingerprint: ${text(p.provenance.fingerprint)}. ${text(p.provenance.versionNote)}`,
    '',
    '## Asset extraction',
    '',
  ];
  for (const o of p.assets) {
    const context = p.assetContexts.find((c) => c.observationId === o.id)!;
    lines.push(
      `### ${text(o.originalAsset)} (${o.assetId})`,
      '',
      `Record: ${o.id}. Original statement/label: ${text(o.originalStance)}. Type: ${o.viewType}.`,
      `Source universe: ${text(o.originalUniverse)}. Geography: ${text(o.universe.geography)}. Currency: ${text(o.currency)}. Reference: ${text(o.benchmark)}.`,
      `Horizon: ${text(o.horizon.original)}; exact months: ${text(o.horizon.months)}; bounds: ${text(context.horizon.minMonths)}–${text(context.horizon.maxMonths)}. Source as-of: ${text(context.sourceAsOfOriginal)} (exact date: ${text(context.sourceAsOf)}).`,
      `Thesis: ${text(o.thesis.text)} (${evidence(o.thesis.evidence)}).`,
      `Evidence: ${evidence(o.evidence)}.`,
      ...o.risks.map((r) => `Risk: ${text(r.text)} (${evidence(r.evidence)}).`),
      ...(o.forecast ? [`Asset forecast: ${o.forecast.value} ${text(o.forecast.unit)}.`] : []),
      '',
    );
  }
  lines.push(
    '## Eight-asset audit',
    '',
    '| Asset | Result | Note |',
    '| --- | --- | --- |',
    ...p.assetAudit.map((a) => `| ${a.assetId} | ${a.status} | ${text(a.note)} |`),
    '',
    '## Macroeconomic extraction',
    '',
  );
  for (const m of p.macro) {
    lines.push(
      `### ${m.topic}: ${text(m.geography)}`,
      '',
      `${text(m.claim.text)} (${evidence(m.claim.evidence)}).`,
      `Scenario: ${text(m.scenario.originalLabel)} (${m.scenario.kind}); probability: ${text(m.scenario.probabilityPercent)}.`,
      ...(m.forecast
        ? [
            `Forecast: ${text(m.forecast.indicator)}; ${m.forecast.kind === 'point' ? m.forecast.value : `${m.forecast.low}–${m.forecast.high}`} ${text(m.forecast.unit)}; target: ${text(m.forecast.targetPeriod)}; basis: ${text(m.forecast.basis)}; source as-of: ${text(m.forecast.sourceAsOf)}.`,
          ]
        : []),
      ...m.risks.map((r) => `Risk: ${text(r.text)} (${evidence(r.evidence)}).`),
      ...m.catalysts.map((c) => `Catalyst: ${text(c.text)} (${evidence(c.evidence)}).`),
      '',
    );
  }
  lines.push(
    '## Open review questions',
    '',
    ...p.issues.map(
      (i) => `- ${text(i.question)}${i.evidence ? ` (${evidence(i.evidence)})` : ''}`,
    ),
    '',
    'No reviewer, approval, public-release timestamp or normalized stance has been assigned.',
    '',
  );
  return lines.join('\n');
}
export async function writeResearchReview(
  workspace: string,
  output: string,
  knowledgeAt = new Date().toISOString(),
) {
  const { inventory, packets } = await loadResearchWorkspace(workspace);
  if (packets.some((p) => Date.parse(p.provenance.verifiedAt) > Date.parse(knowledgeAt)))
    throw new Error('Review knowledge time precedes a packet verification');
  const directory = await assertPrivatePath(output);
  await mkdir(dirname(directory), { recursive: true });
  // Exclusive directory creation: repeat runs never overwrite a review artifact.
  await mkdir(directory);
  const lines = [
    '# Private research pilot review',
    '',
    '**PRIVATE DRAFT — not platform history, approved coverage or an index.**',
    '',
    `Source cutoff: ${inventory.cutoff}. Research window starts ${inventory.periodStart}. Knowledge acquired by: ${knowledgeAt}.`,
    `${inventory.institutions.length} candidates; ${inventory.streams.length} distinct series; ${inventory.publications.length} bibliographic references/access targets; ${packets.length} extraction packages.`,
    '',
    'The inventory is a bounded discovery record, not proof of complete institutional coverage. Missing editions and inaccessible tables are listed below. All macro and asset entries remain pending human review.',
    '',
    '## Calibration queue — five primary series',
    '',
    'These are uncalibrated assisted extractions. Start with the five primary packets below; auxiliary material has separate sheets. The counts describe extraction entries, not institutional votes or financial consensus.',
    '',
    '| Institution | Primary series | Packet | Asset entries | Macro entries |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const stream of inventory.streams.filter((s) => s.defaultForInstitution)) {
    const p = packets.find((p) => p.publication.streamId === stream.id);
    lines.push(
      `| ${text(inventory.institutions.find((i) => i.id === stream.institutionId)!.name)} | ${text(stream.series)} | ${p ? `[Review pending](${p.publication.id}.md)` : 'Not recovered'} | ${p ? p.assets.length : 'Unknown'} | ${p ? p.macro.length : 'Unknown'} |`,
    );
  }
  lines.push(
    '',
    '## Bibliography and access targets',
    '',
    '| Source date | Series | Publication | Access | Review |',
    '| --- | --- | --- | --- | --- |',
  );
  for (const p of inventory.publications
    .slice()
    .sort(
      (a, b) =>
        (a.publishedDate ?? '9999').localeCompare(b.publishedDate ?? '9999') ||
        a.id.localeCompare(b.id),
    )) {
    lines.push(
      `| ${text(p.publishedDate)} (${p.datePrecision}) | ${text(inventory.streams.find((s) => s.id === p.streamId)!.series)} | ${text(p.title)} — ${source(p.officialUrl)} | ${p.access} | ${packets.some((x) => x.publication.id === p.id) ? `[Pending extraction review](${p.id}.md)` : 'No extraction; no stance inferred'} |`,
    );
  }
  const matrices = researchCuts(inventory).map((c) => ({
    ...c,
    knowledgeAt,
    cells: researchMatrix(inventory, packets, c.cutoff, knowledgeAt),
  }));
  for (const cut of matrices) {
    lines.push(
      '',
      `## ${cut.id} — reconstructed draft`,
      '',
      `Cutoff ${cut.cutoff}; knowledge time ${knowledgeAt}. Primary series only; no published eligibility is implied.`,
      '',
      '| Institution / primary series | Asset | Original label | Publication date | View as-of in source | Reasons excluded / qualifications |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const cell of cut.cells) {
      const stream = inventory.streams.find((s) => s.id === cell.streamId)!;
      const institution = inventory.institutions.find((i) => i.id === stream.institutionId)!;
      const context = cell.current?.packet.assetContexts.find(
        (c) => c.observationId === cell.current?.observation.id,
      );
      lines.push(
        `| ${text(institution.name)} / ${text(stream.series)} | ${assets.find((a) => a.id === cell.assetId)!.label} | ${text(cell.current?.observation.originalStance)} | ${text(publicationDate(cell.current?.packet.publication))} | ${text(context?.sourceAsOfOriginal)} | ${text(cell.reasons.join('; '))} |`,
      );
    }
    lines.push(
      '',
      `### Macro evidence at ${cut.id}`,
      '',
      'Pending entries only; auxiliary series are identified, not counted as additional institutional votes. Forecasts with different units, periods or bases are not aggregated.',
      '',
      '| Series | Role | Topic / geography | Claim | Forecast and basis | Evidence |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const packet of availableResearchPackets(packets, cut.cutoff, knowledgeAt)) {
      const stream = inventory.streams.find((s) => s.id === packet.publication.streamId)!;
      for (const m of packet.macro) {
        const f = m.forecast;
        const forecast = f
          ? `${f.indicator}: ${f.kind === 'point' ? f.value : `${f.low}–${f.high}`} ${f.unit}; target ${f.targetPeriod ?? 'Unknown'}; basis ${f.basis ?? 'Unknown'}`
          : 'No quantitative forecast extracted';
        lines.push(
          `| ${text(stream.series)} | ${stream.defaultForInstitution ? 'Primary' : 'Auxiliary'} | ${m.topic} / ${text(m.geography)} | ${text(m.claim.text)} | ${text(forecast)} | ${evidence(m.claim.evidence)}; ${source(packet.provenance.sourceUrl)} |`,
        );
      }
    }
  }
  lines.push(
    '',
    '## Discovery gaps',
    '',
    ...inventory.gaps.map((g) => `- ${text(g.streamId)} — ${text(g.period)}: ${text(g.reason)}`),
    '',
    '## Search and access log',
    '',
    ...inventory.searches.map(
      (s) =>
        `- ${s.checkedAt}: ${text(s.query)}; ${s.url ? source(s.url) : 'No direct URL'} — ${text(s.outcome)}`,
    ),
    '',
    '## Chronological extraction events',
    '',
    '| Date | Series | Asset | Original label | Event |',
    '| --- | --- | --- | --- | --- |',
  );
  const timeline = researchTimeline(inventory, packets);
  for (const e of timeline)
    lines.push(
      `| ${text(publicationDate(e.publication))} | ${text(e.publication.streamId)} | ${e.assetId} | ${text(e.observation?.originalStance)} | ${text(e.event)} |`,
    );
  lines.push(
    '',
    'No index is calculated. The MVP context is only a diagnostic reference; missing mappings, interval horizons, references, age policies and human approvals are not supplied by this report.',
    '',
  );
  await Promise.all([
    writeFile(join(directory, 'README.md'), lines.join('\n'), { flag: 'wx' }),
    writeFile(
      join(directory, 'diagnostics.json'),
      JSON.stringify({ privateDraft: true, knowledgeAt, matrices, timeline }, null, 2) + '\n',
      { flag: 'wx' },
    ),
    ...packets.map((p) =>
      writeFile(join(directory, `${p.publication.id}.md`), packetMarkdown(p), { flag: 'wx' }),
    ),
  ]);
  return { directory, packages: packets.length, publications: inventory.publications.length };
}
