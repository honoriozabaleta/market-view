# Visual handoff to Claude

Read `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/METHODOLOGY.md` and `prompts/02_CLAUDE_DESIGN.md`. Work on this application, with a visual branch based on the integrated engineering foundation. Do not create a disconnected mockup or replace selectors with hardcoded display data.

## Run and explore

Use Node 24, `npm ci`, `npm run dev:demo`. The fixed synthetic clock is 2026-05-20; the demo has Q1/Q2 examples, three explicitly fictional organizations, 25 observation revisions, recorded/reconstructed snapshots and no real recommendations. `npm run dev` uses the empty approved dataset. Installing dependencies/browsers needs download access; no keys are needed.

Primary route: Latest Views → filter asset → open cell → original statement and editorial interpretation → View evidence → Quarterly Archive → choose Q1 recorded/reconstructed cut. Check Imaginary Harbor Treasuries for extraction correction, Paper Moon gold for a partial-update omission, Imaginary Harbor gold for stale data despite recent verification, and Fable Grove EM equities for retrospective incorporation. There is deliberately insufficient coverage in several cells.

## Presentation inventory

| Component/file                                | Contract                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/ui/App.tsx`                              | Four views, detail/evidence routes and hash navigation. Route changes focus main content; archive choice is URL state.   |
| `ComparisonMatrix` in `src/ui/components.tsx` | Receives preclassified `Cell[]`, dataset and temporal query. Every observation is a link; exclusions use native details. |
| `ComparisonFilters` in `src/ui/Filters.tsx`   | Asset, default stream, horizon and display status. Counts are computed before display-status filtering.                  |
| `StanceBadge`, `DateLabel`                    | Textual status and honest null/precision dates. Colors never define the financial meaning.                               |
| `SourceDetail`                                | Citation, locator, publication version/fingerprint, source assessment; no fake external demo links.                      |
| `ChangeHistory`                               | Renders already-classified change labels and dates.                                                                      |
| `EmptyState`                                  | Empty published coverage, missing routes and no filter matches.                                                          |
| `src/ui/styles.css`                           | System fonts, tokens (`--surface`, `--ink-muted`, `--accent`, `--border`, `--radius`, `--space`), base responsive rules. |

At desktop/tablet widths the matrix uses contained horizontal scrolling. At <=600 px it becomes labeled per-stream/per-asset blocks; asset names are `data-asset` labels. Controls have 44 px minimum touch targets, focus rings and semantic labels. Native links/details work without hover. Keep dates, evidence and quality states visible. The base design intentionally has room for editorial hierarchy and density improvements.

## Domain contracts to preserve

Schemas and inferred types are exported from `src/domain/schema.ts`. Financial logic is exported from `src/domain/selectors.ts`; `src/ui/selectors-ui.ts` only adds a publication-date sorting helper. Important selectors:

- `editoriallyEligible` / `eligibleObservations`: lifecycle and cutoff rules.
- `latestObservation`: latest eligible explicit source version per stream/asset, with replacement handling.
- `defaultCohort` / `comparisonExclusions` / `selectCell`: exact financial comparability, status and not-renewed flag.
- `selectedStreams` / `descriptiveCounts`: one default stream per institution, numerator/denominator/exclusions and minimum coverage.
- `changeBetween`: correction, withdrawal, not-renewed, reaffirmed, genuine change or boundary.
- `availableQuarters` / `snapshotQuery`: derived quarter options and pinned immutable archive context.

Do not change mappings, cohort universes, age policy, approval gates or historical availability to fill a screen. Null is not neutral. Allocation is not direction or price forecast. No numeric consensus, portfolio-holdings claims, real reviews or recommendations may be invented. The persistent demo banner and production data boundary must survive redesign.

## Freedom and follow-ups

You may improve composition, typography, navigation, CSS tokens, density, filter state persistence and component organization. Keep domain code independent of presentation. You can split the page components out of `App.tsx`. A modal detail is optional; if introduced, implement dialog semantics, keyboard close and focus return. The existing routed detail intentionally avoids a modal focus trap.

The UI has honest empty states rather than real unapproved content. Do not add third-party logos or fonts without verified rights. There are no hosted services to provision and no credentials to request. Changes to data methodology should be documented for the owner and engineering review.

After changes run `npm run check`, install browsers if needed, then `npm run test:browser`. That command tests six browser/width projects, strict static root/subdirectory reloads, filter/detail/evidence/archive flows, keyboard focus and empty published states. Chromium screenshots are saved under ignored `.local/screenshots/`; inspect them yourself. Automated WebKit at an emulated width is not physical iPad testing. Update this file with changed presentation contracts and actual validation results.
