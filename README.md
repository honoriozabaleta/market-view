# Market View

A personal institutional research and asset management project for comparing **research streams** with traceable evidence. This foundation is a static React + TypeScript application, not a live market terminal. The visual design is intentionally a functional baseline for the next design pass.

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

`data/published/dataset.json` is intentionally empty. No real institutional observations, source usage approvals or human reviews have been invented. Candidate discovery is recorded separately in `data/candidates/registry.json` and excluded from app builds. J.P. Morgan and UBS landing-page metadata were inspected; BlackRock was inaccessible to the browsing tool. Goldman Sachs and Morgan Stanley were not inspected. No standalone latest report is claimed.

Copy `templates/publication-draft.json` to an ignored `.local/` directory, replace all placeholders and dates with verified metadata, then run:

```sh
npm run import:draft -- .local/my-publication.json
```

The importer validates a single-publication dataset and writes an ignored local draft without overwriting an existing file. It never approves or publishes. Read [Data updates](docs/DATA_UPDATES.md) before promotion.

## Read next

- [Methodology](docs/METHODOLOGY.md): eligibility, time, comparability and archive semantics.
- [Architecture](docs/ARCHITECTURE.md): contracts, modules, production boundary and technical decisions.
- [Design handoff](docs/DESIGN_HANDOFF.md): Claude's starting point, components and allowed visual changes.
- [Verification](docs/VERIFICATION.md): commands actually executed and practical limits.
- `AGENTS.md` and `CLAUDE.md`: shared rules and visual instructions.

CI validates and tests pull requests without publication permissions. GitHub Pages has a separate **manual-only** workflow guarded to `main`, with fresh checks and browser tests before deployment. It is prepared, not activated or run. Repository visibility, environment approval rules and Pages setup remain owner-controlled. No push, merge or deployment is part of this delivery.
