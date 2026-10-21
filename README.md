# Market View

**How the world's biggest banks see the markets, reconciled.**

Global banks publish long outlooks every month or quarter. Market View reads them, puts every call on one common five-step scale (strong underweight → strong overweight), and shows in one animated page where the houses agree, where they are split and what changed since the previous edition.

It is an independent personal research project. It is not investment advice and has no affiliation with the institutions shown.

## What the page shows

| Section         | Question it answers                                                                      |
| --------------- | ---------------------------------------------------------------------------------------- |
| Hero and ticker | The quarter in one glance: strongest consensus, biggest split, moves since last edition. |
| 01 Consensus    | Where each house sits on each asset class, with the reasoning one click away.            |
| 02 Full grid    | Every call of every house, with the original wording and source behind each cell.        |
| 03 Signal       | The calls with the most agreement and the most dissent.                                  |
| 04 The numbers  | Year-end targets and macro forecasts (median, range, distance from today's level).       |
| 05 Houses       | One card per house: worldview, profile across assets, freshness of the source.           |
| 06 Narrative    | Recurring themes and the list of upgrades and downgrades.                                |
| 07 Method       | Which report we read per house, how labels map to the common scale, how consensus works. |

## Status

- **Q4 2026 is the first published edition** (`data/editions/2026-q4.json`, cut-off 20 October 2026): five houses, 44 explicit calls and seven forecast cards, each checked against the houses' official publications and reviewed by the owner on 21 October 2026.
- The illustrative Q3/Q4 2026 sample editions now live in `data/examples/`. They are used by the unit tests and are never loaded by the site.
- New editions are drafted privately under `data/drafts/` (git-ignored) and move to `data/editions/` after the owner's review. See [docs/EDITIONS.md](docs/EDITIONS.md).
- The earlier Codex foundation (provenance engine, fictional demo, research pilot) is kept in `archive/codex-foundation/` and on the branch `codex/research-pilot`. It is not part of the build.

## Run locally

Node 24 and npm. No API keys or paid services.

```sh
npm ci
npm run dev          # public data only: data/editions
npm run dev:drafts   # also loads private drafts from data/drafts (local review only)
```

Open the URL Vite prints (normally http://127.0.0.1:5173/).

```sh
npm run validate     # check every edition file (add -- --drafts to include drafts)
npm test             # unit tests: consensus maths, changes, validation
npm run check        # validate + typecheck + lint + unit tests + production build
npm run test:browser # build, serve and run the main stories at 390, 820 and 1440 px
```

Playwright needs a browser. Either `npx playwright install chromium`, or reuse an installed Edge or Chrome: `PW_CHANNEL=msedge npm run test:browser` (PowerShell: `$env:PW_CHANNEL='msedge'; npm run test:browser`).

## How it is built

- **React + TypeScript + Vite**, a single static page. Animations with [Motion](https://motion.dev); fonts (Inter, Bricolage Grotesque) are self-hosted from npm packages under the SIL Open Font License, so the page makes no third-party requests.
- `src/domain/` holds the rules: the catalogue of houses and assets, the data schema (zod) and the consensus maths. The UI only consumes them.
- `src/ui/` holds the presentation. `Globe.tsx` draws the animated globe on a canvas from `src/assets/land-points.json` (Natural Earth 1:110m land, public domain).
- `data/editions/*.json` are the published editions. `data/examples/` holds illustrative fixtures for tests. `data/drafts/` is private work and is blocked from public builds by `vite.config.ts`.

Read next: [Methodology](docs/METHODOLOGY.md) · [Adding an edition](docs/EDITIONS.md) · [Design system](docs/DESIGN.md) · [Publication map of the five institutions](docs/RESEARCH_PUBLICATION_MAP.md).

GitHub Pages deployment is prepared as a manual workflow restricted to `main`; it has not been run. Publishing, merging and repository settings stay with the owner.
