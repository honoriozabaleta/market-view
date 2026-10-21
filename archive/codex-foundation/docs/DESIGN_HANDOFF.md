# Visual handoff to Claude

Read `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/METHODOLOGY.md` and `prompts/02_CLAUDE_DESIGN.md`. Work on this application, with a visual branch based on the integrated engineering foundation. Do not create a disconnected mockup or replace selectors with hardcoded display data.

## Run and explore

Use Node 24, `npm ci`, `npm run dev:demo`. The fixed synthetic clock is 2026-05-20; the demo has Q1/Q2 examples, three explicitly fictional organizations, 25 observation revisions, recorded/reconstructed snapshots and no real recommendations. `npm run dev` uses the empty approved dataset. Installing dependencies/browsers needs download access; no keys are needed.

Primary route: Latest Views → filter asset → open cell → original statement and editorial interpretation → View evidence → Quarterly Archive → choose Q1 recorded/reconstructed cut. Check Imaginary Harbor Treasuries for extraction correction, Paper Moon gold for a partial-update omission, Imaginary Harbor gold for stale data despite recent verification, and Fable Grove EM equities for retrospective incorporation. There is deliberately insufficient coverage in several cells.

## Presentation inventory

Updated by the visual pass on branch `claude/visual-design` (2026-10-19). Domain files, data, schemas and selectors were not modified.

| Component/file                              | Contract                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/App.tsx`                            | Shell only: demo banner, masthead/nav, hash routing, footer. Holds the comparison `Filters` state so filters survive navigation. A changed route focuses main (without scroll jump); `#/methodology/:section` focuses that section. An unchanged route (first mount, StrictMode re-run) never moves focus. |
| `src/ui/clock.ts`                           | The query clock (`now`): dataset `asOf` in demo, real time in published mode. Moved out of `App.tsx` unchanged.                                                                                                                                                                                            |
| `src/ui/pages/*.tsx`                        | `Latest`, `Institutions`, `Archive`, `ObservationDetail`, `Methodology`, split out of `App.tsx`. Same selectors, queries and eligibility checks as before.                                                                                                                                                 |
| `Comparison` in `src/ui/Comparison.tsx`     | Filters → cohort line → result count → matrix → "Views in our coverage" counts table. Counts still use `descriptiveCounts` on the selected streams before the display-status filter. No filters render when the dataset is empty.                                                                          |
| `ComparisonMatrix` in `src/ui/Matrix.tsx`   | Receives preclassified `Cell[]` plus per-asset `coverage` (the `descriptiveCounts` result). Renders a tiled table (>600 px) and an asset-first list (<=600 px); only one is displayed. Cells carry `data-status`, which drives the tile tint/texture.                                                      |
| `ComparisonFilters` in `src/ui/Filters.tsx` | Asset, default stream, horizon (now a radio group styled as a segmented control) and display status. Reset is disabled while filters are at their defaults (hidden on mobile).                                                                                                                             |
| `changes.ts`                                | Presentation wiring of the archive change list, moved from `App.tsx`: pairs each default stream/asset with its latest recorded observation at the previous quarter cut and calls `changeBetween`. Adds identity flags only (`hasPrior`, `sameObservation`).                                                |
| `StanceBadge`, `StatusKey`, `statusLabels`  | Text label for each status, plus a dot marker: filled = counted as comparable, hollow = not counted. Inside matrix tiles the badge becomes an uppercase caption. `StatusKey` restates METHODOLOGY.md definitions; no new rule.                                                                             |
| `CountBar`, `coverageText`                  | Proportional strip of an existing `descriptiveCounts` result (aria-hidden, always next to text). The favorable/neutral/unfavorable split is drawn only when coverage is sufficient; otherwise only comparable vs not compared. No score or index.                                                          |
| `DateLabel`, `InstantLabel`                 | Calendar dates (honest null/month precision, never wrapped) and exact UTC instants for cutoffs/snapshot creation.                                                                                                                                                                                          |
| `SourceDetail`                              | Citation, locator, official link only when a real HTTPS URL exists, version/fingerprint, usage assessment, source check bounded by the knowledge cut.                                                                                                                                                      |
| `ChangeHistory`                             | Rows of already-classified change labels; no connecting line between cuts.                                                                                                                                                                                                                                 |
| `EmptyState`, `PageHead`                    | Empty published coverage, missing routes/cuts, no filter matches (with a "Clear all filters" action); compact page heads with an optional aside.                                                                                                                                                           |
| `src/ui/styles.css`                         | Token sheet and all layout. See tokens below.                                                                                                                                                                                                                                                              |

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

## Visual pass record (Claude, 2026-10-19)

### Direction: Graphite

The owner reviewed a first light editorial pass (ivory, navy, serif headings), rejected it as generic, then chose **Graphite** from three directions rendered on the real app (Swiss, Graphite, Petrol). Graphite is a dark trading-desk interface for long research sessions: graphite surfaces, one chartreuse signal colour for interaction, heavy system sans for headings, monospaced figures for dates and counts. The first screen holds the coverage cutoff, filters and the comparison matrix. No web fonts, images, logos or third-party marks are bundled; the "MV" monogram is plain CSS text.

### Tokens (`src/ui/styles.css`, single theme on `:root`)

| Group    | Tokens                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type     | `--font-sans` (Segoe UI Variable Text / system-ui), `--font-display` (Segoe UI Variable Display / system-ui), `--font-mono`, `--font-data` (mono for figures) |
| Surfaces | `--bg` #0f1012, `--surface` #17181b, `--surface-2` #131416, `--rule` #26282d, `--rule-strong` #3a3d44                                                         |
| Ink      | `--ink` #f1f1ee, `--ink-muted` #9b9ea6, `--accent` #d7f75b (chartreuse), `--accent-strong`, `--accent-soft`, `--accent-ink`, `--focus`                        |
| Masthead | `--masthead-*`, `--mark-*`, `--hero-*`, `--kpi-*` (header band and indicator cards)                                                                           |
| Notices  | `--warn-bg` #241d0a, `--warn-ink` #ffd166, `--warn-rule` (demo banner, synthetic-evidence notice, fictional tags)                                             |
| Status   | `--fav-*` (aqua-mint), `--neu-*` (cool grey), `--unf-*` (rose), `--stale-*` (amber), `--quality-*`, `--hatch`; each with ink, tile background and bar colour  |
| Layout   | `--space-1` to `--space-7`, `--radius` 6px, `--radius-lg` 10px, `--page-max` 1360px, `--gutter`, `--target` 44px, `--sticky-top`                              |

`index.html` declares `color-scheme: dark` and a matching `theme-color`, so native controls and browser chrome follow the theme without a white flash. Computed contrast (translucent tints composited over their surface): body ink 16.8:1, muted ink 6.6–7.1:1, chartreuse on surface 14.7:1, dark text on chartreuse 15.7:1, status captions 6.8–9.4:1 on their tiles, muted text on any tile at least 5.3:1, demo banner 11.6:1.

### Status presentation

The matrix is a mosaic of tiles. Each tile prints the status as an uppercase caption with a dot (filled = counted as comparable, hollow = not counted), the original statement as the link, and `PUB`/`VER` dates in monospace (screen readers hear "Published"/"Verified"). Tiles are tinted for favorable/neutral/unfavorable, diagonally hatched for not disclosed/not comparable, dashed amber for stale and outlined for withdrawn, so no state relies on colour alone. No arrows or direction icons are used: allocation is never drawn as price direction. "Not renewed" stays a text annotation.

Column headers and the "Views in our coverage" table add a `CountBar`: the favorable/neutral/unfavorable split appears only when at least two streams are comparable; otherwise the bar shows only comparable vs not compared (hatched), matching the existing "Insufficient comparable coverage" rule. Every bar sits next to its numbers.

### Views and responsive behavior

- **Latest Views**: full-bleed header band with kicker, title, lead and four indicator cards (cutoff, streams, eligible revisions, methodology version); filters; cohort line; live result count; "Status key" disclosure; matrix; "Views in our coverage" (replaces "Descriptive coverage counts" and states it is not market consensus); "What changed since the previous cut", grouped by identity only (revisions of an already covered asset listed; first covered observations collapsed). Change wording comes unchanged from `changeBetween`.
- **Matrix**: at 1440 px all eight assets fit without scrolling (measured: zero overflow). At 601–1099 px and at 1180 px it scrolls inside its frame with a sticky stream column, asset-count hint, earlier/later buttons and an edge fade; the region is keyboard-scrollable. At <=600 px tiles regroup by asset (one card per asset, one tinted row per stream).
- **View detail**: back link inside the header band; summary card separating "Source says", "Market View classification" (badge only when a status or normalized stance exists) and the source publication date; "Dates & review" side column at >=1100 px, grid on tablet and mobile; "Source statement" (light rule, "From the source") and "Market View interpretation" (chartreuse rule and faint tint, "Our editorial classification — not the source"); "Evidence & source"; observation history.
- **Institutions**: one card per institution with kind and fictional tags; per stream, series identity, division/team, default-stream tag, cadence, age policy, source and usage, latest observation per asset with status in the default 12-month comparison and links, and collapsible publications in coverage. No group-wide house view.
- **Quarterly Archive**: "Archive cut" select (unchanged values); "Selected cut" card whose left rule differs by kind (recorded solid, reconstructed double, quarter to date chartreuse, computed dashed) with the kind written out; "Available cuts" table showing missing snapshots as "None saved"; "Comparison at this cut"; "Changes across cuts" naming the prior cut and its exact UTC instant. Unknown `cut` values show "Unknown archive cut".
- **Methodology & Sources**: "On this page" navigation (sticky at >=1100 px) to linkable sections `#/methodology/comparison|statuses|time|sources|limitations`, status key and archive-cut definitions; contextual links from the matrix, archive, detail and footer.
- **Filters** live in `App` state: shared by Latest and Archive, kept through detail and evidence navigation, reset on reload; not URL state.
- **Header**: single row at tablet and desktop; 2×2 grid of 44 px tabs at <=600 px. The demo banner stays sticky at every width.

### Accessibility notes

Native links, buttons, radios, selects and `details` only; nothing essential depends on hover. Touch targets are at least 44 px (cell links measured 44 px high at 390 px). Chartreuse focus ring (2 px, offset). Horizon is a real radio group. Matrix links keep the exact accessible names used by the browser tests (`Open {institution} {asset}`) and add `aria-describedby` for status, original statement and dates. Bars are `aria-hidden` and always duplicated in text. The result count is a polite live region. Only the demo banner carries `role="note"`. `prefers-reduced-motion` disables smooth scrolling.

### For the owner and Codex (not changed here)

1. The detail page always classifies against the default 12-month cohort, even when the matrix was filtered to 3 months, because detail links do not carry the horizon. The detail says so explicitly. Carrying the horizon in `contextParams` needs an engineering decision.
2. `Archive` resolves any snapshot ID in `?cut=` without the `createdAt <= now` filter that the select applies. Behavior kept as is.
3. The foundation detail printed the current cell's exclusion reasons even for an earlier revision; the interpretation now states that the revision is not the comparison cell. No selector changed.
4. The institutions page publication count uses the same released-state filter as its list (`editorialState`, `marketViewPublishedAt` and `firstObservedAt` by the clock) instead of `firstObservedAt` alone. Demo counts are unchanged (3/2/3).
5. `changeBetween` returns display strings; a typed change kind would allow emphasis without string matching. This pass does not parse those strings.
6. Matrix link names (`Open …`) omit the visible statement (WCAG 2.5.3). They were kept because the browser tests assert exact names; change tests and names together.
7. Fixed during this pass (presentation only): the foundation route effect focused `main` on the second StrictMode effect run in development, and WebKit then applied the focus scroll after `scrollTo(0, 0)`, opening the page about 50 px down. The effect now tracks the last handled route and focuses with `preventScroll`.

### Validation actually run (Windows, Node 24.18.1)

- `npx playwright install chromium webkit`: the browsers were missing on this machine and were installed.
- `npm run check`: data validation, typecheck, lint (zero warnings), 31 unit tests, published build and artifact audit passed.
- `npm run test:browser`: 24 of 24 passed (four stories × Chromium/WebKit × 390/820/1440) on the final Graphite version.
- Screenshot sweep (scratch script under ignored `.local/`): 11 demo routes × 390/820/1440 in Chromium, plus WebKit at 820 and 1180 for Latest, detail and reconstructed archive; no page errors and no document-level horizontal overflow. Published empty states captured at all three widths. The three candidate directions were also captured at 1440 and 390 for the owner's choice.
- Scratch interaction checks (Chromium and WebKit): scroll buttons by keyboard, sticky stream column, horizon by arrow keys, status key by keyboard and touch, reasons by touch, filter persistence through detail and archive, methodology anchor focus, dates on the mobile detail, initial load at scroll top without forced focus, and a published build without filters or demo note. Chromium's Tab order runs filters → status key → matrix region → row header → cell link → reasons. Playwright WebKit skips plain links on Tab, as Safari does by default.

Limits: automated engines at emulated widths, not a physical iPad, iPhone or Safari installation, and no screen-reader audit. Segoe UI Variable is used where Windows provides it; other platforms fall back to their system UI font, so letter widths differ slightly from these Windows captures.

## Engineering release follow-up

See [RELEASE_REVIEW.md](RELEASE_REVIEW.md) for the independent diff review and executed checks. The Graphite styles/layout remain unchanged. Items 1, 2 and 6 in the earlier "For the owner and Codex" list are now resolved: links carry a validated comparison horizon through detail/evidence/reload, archive URLs cannot select future-created snapshots, and matrix accessible names include the visible original stance. Existing links without a horizon retain the 12-month default. `InstantLabel` now preserves fractional UTC precision. No domain rule, source dataset, editorial approval or snapshot was changed.
