# Market View

A personal institutional research and asset management project for comparing **research streams** with traceable evidence. This foundation is a static React + TypeScript application, not a live market terminal. Its editorial presentation layer is documented in the [design handoff](docs/DESIGN_HANDOFF.md); the visual pass did not change financial contracts.

## Current focus: study the publication landscape

The owner paused further extraction and index work on 2026-10-20 to study the available material before choosing the next product. Start with the single [institutional research publication map](docs/RESEARCH_PUBLICATION_MAP.md): the five institutions, their Research/Wealth/Asset Management teams, document families, official entry points, access limits and a reading guide.

The existing pilot is preserved on this branch. Private captures and seven pending extraction packets remain under ignored `.local/research-pilot/`; they are not restored by a Git clone. [Project context](docs/PROJECT_CONTEXT.md) records the change of direction and outstanding calibration questions.

## Run locally

Use Node **24.x** (see `.nvmrc`) and npm. Dependency and browser installation require download access; no API keys or paid services are required.

```sh
npm ci
npm run dev:demo
```

Open the Local URL printed by Vite (normally `http://127.0.0.1:5173/`). Demo is an explicit separate mode with the persistent warning **“Demo data — not actual institutional views”**. Its clock is fixed at **2026-05-20** to keep the Q1/Q2 examples reproducible. All three institutions and their views are fictional. Review dates in fixtures simulate lifecycle events, not real human approvals.

Try Asset → US equities → Paper Moon cell → View evidence. In Quarterly Archive choose the recorded or reconstructed Q1 snapshot. The reconstructed archive includes a March document first added in May. Compare the original-label and editorial-interpretation sections and the correction history for Imaginary Harbor US Treasuries.

```sh
npm run dev                    # published mode: honest empty state
npm run validate:data          # schemas, references, editorial rules, archive integrity
npm run typecheck
npm run lint
npm test                       # unit and local import tests
npm run build                  # published-only static artifact + artifact audit
npm run build:demo             # explicit demo artifact in dist-demo (never deploy this)
npx playwright install chromium webkit
npm run test:browser           # builds and serves static root/subdirectory/published variants
npm run check                  # validation + typecheck + lint + unit tests + published build
npm run preview                # inspect published dist locally, normally port 4173
```

To preview a demo build: `npx vite preview --mode demo --outDir dist-demo --host 127.0.0.1`. Hash navigation supports direct links and reloads on static hosting with no rewrites. Example: `/#/observations/demo-paper-q2-us-equities` in demo.

For a different base path, set `BASE_PATH` in the command environment. PowerShell:

```powershell
$env:BASE_PATH = '/market-view/'
npm run build
npm run preview
Remove-Item Env:BASE_PATH
```

## Data and review

`data/published/dataset.json` is intentionally empty. No source usage approvals or human reviews have been invented. The original discovery is recorded in `data/candidates/registry.json`; the separate stage-2 pilot inventory records subsequent bibliographic checks and gaps. Both are excluded from app builds. Private extraction packets are not published coverage or a claim of the latest institutional opinion.

Copy `templates/publication-draft.json` to an ignored `.local/` directory, replace all placeholders and dates with verified metadata, then run:

```sh
npm run import:draft -- .local/my-publication.json
```

The importer validates a single-publication dataset and writes an ignored local draft without overwriting an existing file. It never approves or publishes. Read [Data updates](docs/DATA_UPDATES.md) before promotion.

## Private research pilot

Stage 2 added assisted asset and macro extraction, private review packets and Q3/Q4 reconstruction diagnostics. This work is preserved and paused; historical discovery and human calibration remain incomplete. It leaves the UI and methodology 1.0.0 unchanged. Read [project context](docs/PROJECT_CONTEXT.md), [pilot workflow and coverage](docs/RESEARCH_PILOT.md) and the [index research proposal](docs/INDEX_RESEARCH.md).

```sh
npm run research:validate -- .local/research-pilot
npm run research:review -- .local/research-pilot
npm run research:import -- .local/new-package.json .local/research-pilot
```

Real packets are ignored local work and are not restored by cloning the repository. The commands require a workspace containing `inventory.json` and `packages/*.json`. The tracked bibliographic inventory contains no extracted institutional views. Review output uses a new private directory and refuses overwrites. No command approves, promotes or calculates an index.

## Read next

- [Methodology](docs/METHODOLOGY.md): eligibility, time, comparability and archive semantics.
- [Architecture](docs/ARCHITECTURE.md): contracts, modules, production boundary and technical decisions.
- [Design handoff](docs/DESIGN_HANDOFF.md): Claude's starting point, components and allowed visual changes.
- [Verification](docs/VERIFICATION.md): commands actually executed and practical limits.
- `AGENTS.md` and `CLAUDE.md`: shared rules and visual instructions.

CI validates and tests pull requests without publication permissions. GitHub Pages has a separate **manual-only** workflow guarded to `main`, with fresh checks and browser tests before deployment. It is prepared, not activated or run. Repository visibility, environment approval rules and Pages setup remain owner-controlled. No push, merge or deployment is part of this delivery.
