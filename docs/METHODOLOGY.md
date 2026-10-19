# Methodology 1.0.0

## Unit of coverage

A research stream identifies an institution, organization type, division, team, series and official source. A bank and an asset manager are different organization types. The default comparison includes at most one stream per institution. Coverage is curated and incomplete. “Latest” means the latest dated, verified, editorially eligible explicit observation in that coverage, never a claim about an institution's complete or real-time opinion.

## Meaning and comparison

The catalog covers US, European and EM equities; US Treasuries; investment-grade and high-yield credit; US dollar; gold. `src/domain/catalog.ts` defines the initial comparison universe for each. Credit defaults to the US universe; USD is the comparison currency. Catalog defaults are comparison criteria, never a replacement for an unknown source universe.

Allocation stance, directional view, quantitative forecast and narrative are separate types. Only explicit allocation labels with an exact, documented stream/context mapping can become favorable, neutral or unfavorable. Mapping requires the original label, universe, geography, currency, reference and horizon. Fixture mappings have no authority over real institutions. “Attractive” and “bullish” do not imply overweight; a Fed forecast never implies duration allocation.

The initial cohort uses Strategic allocation as its reference and an explicitly selected 12- or 3-month horizon. Selectors require exact universe, type, horizon, reference and currency. Unknown horizons, unmapped labels and other contexts are excluded with reasons. The UI retains excluded observations and their evidence; it does not coerce them into the selected cohort.

Not disclosed means no dated eligible explicit observation in coverage. Not comparable means a covered observation fails cohort requirements. Stale means source publication age exceeds the stream policy, even if verification is recent. Withdrawn means an explicit withdrawal. None means neutral. These quality states may coexist with mismatch reasons; the cell displays withdrawal first, then stale, then comparison eligibility.

Descriptive counts expose numerator, comparable denominator, selected cohort size and exclusions before the status display filter. At least two comparable streams are required; otherwise coverage is insufficient. One default stream per institution and one latest observation per stream/asset prevent duplicate votes. Counts describe published research labels, not holdings, a representative market consensus or investment suitability. There is no sentiment score, numeric consensus index or performance ranking.

## Time and selection

Dates distinguish publication, first observation, observation verification, editorial review and first platform release. Missing source publication dates are null and excluded from latest selection. Month precision is stored as the first day with an explicit precision flag and becomes eligible only at the end of that month, a conservative bound. All lifecycle timestamps use UTC; UI dates are calendar labels rather than download-date substitutions.

A recorded query includes only source publications dated by its cutoff and records first observed, verified, approved and publicly released by that same cutoff. A reconstructed query retains the publication cutoff but may use knowledge acquired by a later explicit `knowledgeAt` timestamp. It cannot import later source publications. The distinction is surfaced in the archive and passed through detail/evidence links.

Latest selection uses source publication date, then verification of an explicit revision, then a stable ID tie-breaker. It removes available explicit replacements first. An unavailable correction cannot erase the old record in an earlier cut. A new version under the same URL gets a new publication ID and `supersedesPublicationId`; retain both versions. Supersession is applied per asset, so a partial publication never refreshes unrelated assets. An omission does not mean neutral or reaffirmed. Carried-forward views retain their date and are marked not renewed when later stream publications exist.

Cadence is nullable. Each stream has an explicit `staleAfterDays` and a visible rationale for that threshold. The fixtures use an unverified 100-day assumption solely to exercise behavior. Verification does not reset publication age. Changing an actual series policy requires owner review and versioned methodology/context, not a cosmetic UI adjustment.

## Changes and archives

Genuine changes require comparable observations with non-null normalized stances. Different types, horizons, universes, currency or references establish a comparison boundary. Methodology changes require an identified methodology version and separate archive comparison; cross-methodology deltas are not computed by this MVP. Extraction corrections are labeled as corrections and are never announced as institutional view changes. Withdrawals are explicit events. The same observation across cuts is not renewed; a new equivalent explicit stance can be reaffirmed.

Quarter options derive from eligible publication dates and saved snapshot cuts. The open quarter is “Quarter to date,” capped at the actual query clock, never a future quarter-end date. The synthetic demo clock is explicitly frozen in Q2 2026. Computed quarter-end selections are distinguished from saved snapshots.

Snapshots pin exact observation IDs, publication IDs/versions, cutoff, creation time, nature and methodology version. Recorded captures use their actual creation instant as cutoff and reflect platform availability then. A capture made later for an earlier cutoff is reconstructed; it may include historical documents incorporated by creation time. Closed snapshots and all referenced evidence/context are immutable. A correction appends an observation revision and, when necessary, a new snapshot ID/revision with `supersedesSnapshotId`. Baseline validation rejects silent changes or deletion. Later reconstruction is not proof of what the platform displayed previously.

## Evidence and editorial rules

Each thesis, risk and editorial interpretation has its own bibliographic citation and page, section or table locator. Original labels and source statements remain distinct from the project's normalization/interpretation. Quotations are optional; a bibliographic reference may suffice. No original PDF, report screenshots or full texts are stored. Unknowns remain null or explicit unknown states.

Public data requires a real named reviewer, approval date and rationale per observation revision, explicit platform release dates, a public HTTPS publication URL and a human-approved source usage scope. Pending, rejected, simulated, link-only and excluded records cannot feed published views. Source assessment categories are pending review, link only, approved scope and excluded. Public access, attribution and a disclaimer are not substitutes for the owner's usage review. Only fictional fixtures use the separate simulated `demo` status.
