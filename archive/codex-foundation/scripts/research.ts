import {
  loadResearchWorkspace,
  writeResearchReview,
  importResearchPackage,
} from './research-workspace';

const [command, first = '.local/research-pilot', second] = process.argv.slice(2);
if (command === 'validate') {
  const { inventory, packets } = await loadResearchWorkspace(first);
  console.log(
    `Valid private research: ${inventory.publications.length} bibliographic references/access targets; ${packets.length} pending extraction packages. No approval or publication performed.`,
  );
} else if (command === 'review') {
  const result = await writeResearchReview(
    first,
    second ?? `${first}/reviews/${new Date().toISOString().replaceAll(':', '-')}`,
  );
  console.log(`Private review written: ${result.directory} (${result.packages} packages).`);
} else if (command === 'import' && second) {
  console.log(`Pending private package saved: ${await importResearchPackage(first, second)}`);
} else {
  throw new Error(
    'Usage: research validate [workspace] | review [workspace] [new-private-output-directory] | import input.json workspace',
  );
}
