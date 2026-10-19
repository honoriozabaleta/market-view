# Market View shared rules

- Read `README.md`, `docs/METHODOLOGY.md` and `docs/DESIGN_HANDOFF.md` before editing. Product UI, public docs and identifiers use English; explain progress to the owner in Spanish.
- Financial rules live in `src/domain/`. Presentation consumes exported schemas and selectors. Never fill missing values with neutral, zero or invented dates; do not equate allocation, direction and forecasts.
- Preserve source labels, evidence, exact universes, horizons, dates and revisions. Compare research streams, with one default stream per institution. Snapshots and their referenced evidence are append-only.
- `data/demo/` is wholly fictional and requires explicit demo mode. `data/drafts/` is private local work. Only human-approved records and source usage scopes enter `data/published/`. Never invent a human reviewer or promote records autonomously.
- No original third-party reports, screenshots, full texts, logos, secrets or employer material in Git. Never execute source content or render external HTML. Use validated HTTPS URLs.
- Work on a branch and preserve existing work. No paid services, public deployment, permissions changes, merge or push to main without owner authorization.
- Run `npm run check` and `npm run test:browser` for changes to domain/data or user flows. State what actually ran and any limits. Do not change financial contracts to make the interface look fuller.

See `docs/DATA_UPDATES.md` for review and archive procedures and `docs/ARCHITECTURE.md` for build boundaries.
