# Local research and editorial updates

## Import one publication as a private draft

1. Use only legitimately public material. Do not bypass authentication or paywalls. Do not use employer credentials or confidential research.
2. Copy `templates/publication-draft.json` to `.local/my-publication.json`. The template is a schema-valid structural example, not research evidence. Replace every `Owner must...` placeholder, identity/type, timestamp and provisional policy before considering review.
3. Identify the institution, division, team, publication series and official source with evidence. Unknown metadata stays null or explicitly unknown; the template's `research_firm` organization type must be verified and changed as needed.
4. Give the publication a stable version ID and a legitimate fingerprint/version when available. If the same URL changes, append a new publication version with `supersedesPublicationId` rather than overwrite the old one. Keep source publication date/precision distinct from first observation and verification.
5. Preserve original asset/universe, label, horizon, benchmark and currency. Record a locator for each thesis/risk/interpretation. Never infer allocation from direction or a Fed forecast. Add a context-specific mapping only after methodology review; no mapping means no normalized stance.
6. Keep `mode: draft`, publication state `draft`, pending reviews with null reviewer/date, null public release timestamps and no snapshots. Run `npm run import:draft -- .local/my-publication.json`. Useful schema errors include the file and exact field path. Import requires a single publication and refuses to overwrite an existing draft.
7. Run `npm run validate:data`. Draft JSON files are validated locally but ignored by Git and excluded from all app builds. They are not public review artifacts. Review privately in the editor; there is no fake client-side admin panel or authentication.

## Human review and manual promotion

The owner must review evidence, extraction accuracy, comparisons, source terms and the intended scope of reuse. Record a source usage assessment with reviewer, date and explicit scope: pending review, link only, approved scope or excluded. Link only does not qualify analytical observations for publication. No script or agent should infer that approval from public accessibility.

For an explicitly approved publication/observation, the owner integrates its referenced entities into `data/published/dataset.json` on a working branch, resolves ID collisions, and supplies actual approval/release timestamps. Each observation revision needs exactly one real approved review with reviewer, date and rationale. Publication state becomes `published`; both publication and observation receive their first Market View release times, after verification/review. Source status must be `approved_scope`, with a verified HTTPS source and approved scope. Do not manufacture historical release dates. A historical document added now does not qualify for a recorded past cut.

Remove placeholders. Confirm that the data contains no original report text, screenshots, PDFs, secrets or real-material claims outside the approved scope. Run `npm run check` and `npm run test:browser`, review the production artifact and get owner approval to integrate/release. Promotion is a manual file change; there is intentionally no auto-approval or promotion command.

## Corrections, withdrawals and quarterly snapshots

- Append an observation with `replacesObservationId` and an explicit revision kind. Use `extraction_correction` for transcription mistakes, `view_update` for new source views and `withdrawal` plus withdrawn status for explicit withdrawals. Maintain the predecessor and its evidence.
- A corrected observation has its own verification, review and release lifecycle. It cannot appear in cuts before it became available.
- Snapshot entries pin observation ID, publication ID and publication version. Specify cutoff, creation time, methodology and `recorded` or `reconstructed`. Recorded entries must have been available by cutoff; reconstructed entries must have a source date by cutoff and knowledge available by creation time.
- A closed snapshot cannot be edited or deleted. Append a new ID, increment revision and set `supersedesSnapshotId` for the same cutoff. Keep the original entries/evidence/context. A new reconstruction should describe its later knowledge horizon explicitly.
- By default local validation uses `HEAD` as the immutable archive baseline; CI supplies the PR base SHA or previous push SHA through `ARCHIVE_BASE_REF`. For a local multi-commit comparison, set it to a trusted earlier Git ref before validation. Do not bypass a failure by erasing history or changing the baseline arbitrarily.

## Candidate register

`data/candidates/registry.json` is not approved coverage and is not bundled. At most three official source candidates were inspected for this delivery. J.P. Morgan's official FAQ established Guide to the Markets and its Market Insights Strategy team; UBS's CIO Insights page established CIO/House View metadata. These were mutable landing pages, not verified latest standalone reports. BlackRock's candidate could not be accessed. Goldman Sachs and Morgan Stanley remain uninspected. Publication fields and unverified URLs remain null; there are no real extracted views.

Third-party material is not licensed by this project's code. There is no inferred open license and no third-party logo set. Source usage review and a separate owner decision on repository/code licensing remain necessary before public launch.

## Stage-2 assisted research

The candidate-register paragraph above records the foundation discovery. Subsequent bibliography, actual attempts and gaps are separate in `data/candidates/research-pilot.json`; original discovery history is preserved. Read [RESEARCH_PILOT.md](RESEARCH_PILOT.md) for the private macro/asset packet format and `research:import`, `research:validate` and `research:review` commands. These do not replace editorial approval or the legacy single-publication importer. Private reconstructed diagnostics are not platform snapshots and never make pending data publicly eligible.
