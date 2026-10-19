# Verification record

The independent post-design review, reproduced issues, fixes and latest test totals are recorded in [RELEASE_REVIEW.md](RELEASE_REVIEW.md). The record below describes the earlier foundation verification.

Executed locally on Windows on **2026-10-19**, with Node 24.18.1 and npm 11.16.0. No GitHub workflow, publication, push or merge was executed.

| Command/action actually run                    | Result                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                       | Clean lockfile installation succeeded; npm reported zero known vulnerabilities.                                                       |
| `npm run validate:data`                        | Published empty dataset, 25 demo observations, candidate registry, references and editorial/archive checks passed.                    |
| `npm run typecheck`                            | Passed with strict TypeScript.                                                                                                        |
| `npm run lint`                                 | Passed, zero warnings.                                                                                                                |
| `npm test`                                     | **31 tests passed** across domain, real local draft import and real Vite build-boundary tests.                                        |
| `npm run build`                                | Published static build passed; all emitted artifacts inspected for synthetic identities/IDs, private draft canary and candidate text. |
| `npm run check`                                | Complete validation/typecheck/lint/unit/build chain passed.                                                                           |
| `npm run build:demo`                           | Explicit demo artifact built successfully in ignored `dist-demo/`.                                                                    |
| `npx playwright install chromium webkit`       | Both browser engines downloaded and installed successfully.                                                                           |
| `npm run test:browser`                         | **24 browser tests passed**, four stories across Chromium/WebKit at 390, 820 and 1440 px.                                             |
| Screenshot review                              | Inspected actual Chromium matrix and detail captures, including all three viewport widths.                                            |
| `npm run dev:demo -- --port 5173 --strictPort` | Vite served demo locally; an HTTP request to its root returned 200.                                                                   |

The unit suite distinguishes missing, neutral, unmapped, stale and withdrawn records; allocation/directional/quantitative/narrative types; exact horizons, universes and currency; publication-age policy; omitted assets; changes versus extraction corrections; dated ordering and unavailable corrections; recorded/reconstructed cuts; month precision and equivalent UTC timestamp spellings; immutable archive evidence; duplicate IDs/contexts/default streams; human editorial fields and source usage approval; required evidence; safe URL protocols; and mutable-publication version identities. Published eligibility is exercised with explicitly labeled test doubles, never real institutional views or invented human approvals in app data.

Import tests invoke the actual command in a separate Node process, verify pending status and null public-release dates, reject overwrites, and assert useful field paths on invalid URLs. The build-boundary test places a private canary outside published data, inspects a real in-memory Vite build, then attempts an unpublished import and confirms that the build is rejected. Temporary test inputs are removed after tests.

Browser stories cover filters → cell → original statement/editorial interpretation → evidence → reconstructed archive → pinned detail and return navigation; direct hash links and reloads at `/market-view/`; keyboard skip/focus/Enter, narrow-screen touch activation, empty-filter/reset and document overflow; and honest empty production at both root and subdirectory. Static QA servers have **no SPA fallback**; invented server paths and unpublished data requests return 404. Query parameters cannot activate demo in production. Historical detail does not display a source check performed after its knowledge cut.

Initial browser failures exposed implicit-label lookup problems and a test that sent Tab before React had mounted. Labels now use explicit associations and keyboard tests wait for the rendered page. A text assertion was corrected to inspect the statement paragraph. The final full run passed in both engines with normal Tab navigation.

## Practical limits

- These are automated desktop browser engines with configured viewports/touch capability, not a physical iPad, iPhone or Safari installation. No physical-device compatibility claim is made.
- The basic UI is functional and accessible by tested keyboard/touch flows; it has not undergone a formal assistive-technology audit. The 2026-10-19 visual pass and its own validation run are recorded in `docs/DESIGN_HANDOFF.md`.
- GitHub Actions/Pages configuration was prepared against official documentation but has not been run remotely. No repository visibility, Pages settings, branch protection or environment approval settings were changed. A public launch still needs owner authorization and repository-side setup.
- Real sources and observations remain pending owner review. No real recommendation was extracted/published. Candidate landing-page checks do not establish the latest report or reuse rights.
- Dependency and browser downloads require network access. This delivery requires no API keys or paid services.
- Development/build/test outputs and screenshots are ignored local artifacts, not third-party source material or files for publication.
