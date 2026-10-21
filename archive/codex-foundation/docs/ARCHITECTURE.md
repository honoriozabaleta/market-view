# Architecture

## Static vertical slice

`versioned JSON → DatasetSchema → temporal selectors → comparison cells → evidence detail → immutable quarterly snapshots`

React 19, TypeScript 5.9, Vite 8, Zod 4, Vitest 5 and Playwright 1 are installed at exact versions with an npm lockfile. Node 24 satisfies the installed packages' engines. TypeScript 5.9 stays within typescript-eslint's supported range. The project uses local system fonts, plain CSS tokens, no UI framework, backend, account system, paid service, Python or runtime API.

| Location                  | Responsibility                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/domain/schema.ts`    | Exported strict entity schemas/types, references, mappings, dates and editorial validation                  |
| `src/domain/catalog.ts`   | Short asset catalog and initial cohort universe                                                             |
| `src/domain/selectors.ts` | Temporal eligibility, latest observation, comparison, counts, change classification, quarters and snapshots |
| `src/data/load.ts`        | Validates exactly the dataset selected at build time                                                        |
| `src/ui/`                 | Hash navigation, semantic views and reusable presentation                                                   |
| `data/demo/`              | Entirely synthetic, versioned, explicit demo only                                                           |
| `data/drafts/`            | Ignored local research, never imported into the app                                                         |
| `data/candidates/`        | Unpublished candidate metadata; no approved real views                                                      |
| `data/published/`         | Publicly approved dataset; currently empty                                                                  |
| `scripts/`                | Validation, import, archive integrity, build audit, static QA                                               |
| `tests/`                  | Domain/lifecycle tests and browser stories                                                                  |

## Production boundary

Vite resolves `@dataset` to a single file: `data/demo/dataset.json` only for `--mode demo`; otherwise `data/published/dataset.json`. The UI cannot enable fixtures with a URL parameter, local storage or a toggle. Published mode also asserts the dataset's mode. `publicDir` is disabled to avoid accidental copying of working documents. A Vite plugin blocks unpublished imports and rejects demo/draft/candidate module IDs in the production module graph. No source maps are emitted.

`npm run build` validates published data, builds `dist`, and inspects every artifact for fixture names/IDs, a draft canary and candidate text. Browser tests also request raw unpublished paths and expect 404. Both module-graph checks and artifact checks matter; filtering records in React would not establish this boundary. Demo builds go to a separate `dist-demo/` and are never selected by the Pages workflow.

Drafts and `.local/` are ignored; validation checks tracked Git paths, not just ignore patterns. Treat the dev server as local development tooling, not a public or access-controlled server. No authentication is implied. Importing never makes data public. Strings are React text, never evaluated or rendered as HTML; source links are HTTPS without embedded credentials and external anchors use noopener/noreferrer.

## Routing and state

Routes use hashes: `#/latest`, `#/institutions/:id`, `#/archive?cut=...`, `#/observations/:id?...`, `#/evidence/:id?...`, `#/methodology` and `#/methodology/:section`. Detail links carry cutoff, archive nature, knowledge time and optional pinned snapshot identity. Snapshot detail resolves only pinned entries. Archive selection persists in the URL across reloads/back links. Comparison filters are in-memory `App` state shared by Latest Views and Quarterly Archive: they survive navigation to detail, evidence and back within a session, and reset on reload. They are not URL state.

`BASE_PATH` is build-time configuration, separate from hash routing. The browser suite uses a strict local file server with no SPA fallback, at `/` and `/market-view/`. There are no server rewrites to conceal broken links. Root and subdirectory artifacts are built separately.

Post-design review: detail/evidence links also carry the selected comparison `horizon` (3 or 12 months); missing values retain the existing 12-month default and invalid values are rejected. This context feeds `defaultCohort` without changing the source horizon. Entering a linked context restores that horizon in shared filter state, including after a detail reload. Archive deep links resolve only snapshots created by the current query clock.

## Versioning and extension

Keep schema and methodology versions explicit. This first implementation supports methodology 1.0.0; a future methodology needs version-aware schemas/selectors and explicit comparison boundaries. Do not change the literal without designing historical compatibility. Publication IDs identify content versions; observations identify extraction/research revisions. Snapshots pin both. `scripts/archive-integrity.ts` compares existing closed archives and their referenced observations, reviews, publications, mappings and stream/source/institution context against a Git baseline. A policy/context change affecting archived evidence requires an appended context/version, not mutation.

The dataset is small enough for pure array selectors; optimize with indexes if scale warrants it. Never move financial rules into components to optimize UI rendering. This version uses exact cohort equivalence and does not attempt probabilistic narrative interpretation or horizon-overlap heuristics.

## Private research workspace

The stage-2 research contracts and selectors are separate domain modules. They reuse existing publication/observation/evidence types without changing DatasetSchema or the application's selectors. Their private diagnostics distinguish source-publication cutoffs from retrieval knowledge times, preserve interval horizons, and permit a null unapproved age policy. The optional legacy bridge is absent when the existing Dataset contract cannot be populated honestly.

The research CLI reads an ignored workspace and generates escaped Markdown plus JSON; it has no browser/admin surface, source-content execution, index engine, approval or promotion path. Outputs are confined to private storage and refuse overwrites. The bibliography under candidates contains metadata/access outcomes only. Both production and demo reject `.local` imports; production also rejects demo/drafts/candidates imports. Real local packages are validated when present; CI exercises synthetic fixtures without requiring uncommitted research material. See [RESEARCH_PILOT.md](RESEARCH_PILOT.md) for scope and actual coverage limitations.

## Official technical references checked

- [React versions](https://react.dev/versions)
- [Vite setup and Node requirements](https://vite.dev/guide/) and [base path/static deployment](https://vite.dev/guide/static-deploy.html)
- [Zod strict TypeScript setup](https://zod.dev/)
- [Vitest compatibility](https://vitest.dev/guide/)
- [Playwright installation](https://playwright.dev/docs/intro)
- [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Docs and npm package engine/peer metadata were checked on 2026-10-19. Installed versions, rather than unbounded latest ranges, are recorded in `package-lock.json`.
