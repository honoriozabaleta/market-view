# Project context and owner decisions

Recorded on 2026-10-20 from three owner-supplied ChatGPT Pro conversations and the subsequent planning discussion. Those conversations are product context, not financial evidence. Their example recommendations, publication dates, links and institutional claims must be independently verified before use. No attachment or illustrative position is a research record.

The first conversation explains market views and the differences between teams, allocation, direction and forecasts. The second proposes an institutional outlook tracker, historical coverage and later indicators. The third specifies one repository, a small verified foundation, a visual handoff and an engineering release review. The repository implemented that foundation and visual pass; the owner then prioritized real research work. The subsequent change of direction is recorded below.

## Purpose

Market View is a personal research and asset management project: build a traceable historical database of institutional investment perspectives, compare sufficiently equivalent observations, and study changes and disagreement. The website is a presentation of that research. It is not a live terminal, a portfolio-position database or a trading recommendation service.

The useful unit is a named division, team and publication series, not a group's supposedly unified opinion. Allocation, directional views, economic scenarios and quantitative forecasts remain different statements. The project's professional value comes from defensible research decisions and reproducibility.

## Responsibilities

- Owner: research priorities, source selection, methodology decisions, source-usage assessment and actual editorial approvals.
- Codex and owner: data contracts, discovery, assisted extraction, validation, historical reconstruction and proposed indices.
- Claude: future visual identity and presentation on the same repository and financial contracts. The current Graphite design is not the owner's final design choice. This research stage does not redesign it.

## Decisions for stage 2

1. Pilot the five original institutions: JPMorgan Asset Management Multi-Asset Solutions, UBS CIO, BlackRock Investment Institute, Goldman Sachs Wealth Management ISG and Morgan Stanley Wealth Management GIC. Preserve unavailable candidates rather than silently replacing them.
2. Investigate all publicly discoverable publications in the selected series from July 2026 to a fixed Q4 cutoff; consult antecedents when needed. Disclose the search boundary and gaps rather than claim institutional exhaustiveness.
3. Extract asset views, theses and risks plus macroeconomic growth, inflation, monetary/fiscal policy, employment, scenarios and catalysts when stated. Keep numeric forecasts and their measurement bases separate.
4. Start with assisted, reviewable local work. No scheduled monitoring, paid API, mass scraper or hosted database is introduced.
5. Research indices by asset and exact comparison context: balance, categorical disagreement and revisions. No cross-asset risk score, performance ranking or investible strategy is part of this stage.
6. Produce private calibration packets first, then further batches. All assessments and observations remain pending real human review. An implementation request is not approval of any extracted claim or source-usage scope.

## Existing foundation versus this stage

The foundation's methodology 1.0.0, fictional demo, append-only snapshots and approved-data boundary remain authoritative for the application. Stage 2 adds a private research workspace and a separate index proposal; it does not make the MVP's comparison cohort broader or its two-stream descriptive-count minimum into an index threshold.

See [research workflow](RESEARCH_PILOT.md) and [index research proposal](INDEX_RESEARCH.md). Earlier prompts document the foundation delivery, not a permanent prohibition on researching later capabilities. Public deployment and data promotion still require separate owner authorization and recorded approvals.

## JPM Q4 calibration discussion — 2026-10-20

The owner asked to inspect the pending JPM MAS packet, its macro scenario, evidence and interpretation questions. The discussion was exploratory; it did not approve the packet, a mapping, a source-usage scope or a public release.

The packet remains unchanged. Refinements proposed for later review include distinguishing an income/carry preference from an explicit allocation intensity; preserving relative FX trade legs rather than generalizing to broad USD; separating an original stance label from its causal thesis; retaining source ideas outside the initial eight-asset catalogue; separating current macro assessments, forecasts and risks; and consistently describing unread charts versus topics absent from the captured text. Qualitative forecast wording must not acquire invented numeric points or bounds.

Allocation horizon, currency and reference remain unverified where missing. A price-target horizon does not fill those fields. Mutable current pages do not prove Q3 content. The detailed discussion is appended privately at `.local/research-pilot/notes/2026-10-20-jpm-calibration.md`; the earlier packet and generated review sheet are retained.

## Owner change of direction — 2026-10-20

The owner requested that all work to date be preserved and the repository left organized, then asked for one Markdown mapping the document types available across the same five institutions, including macro, outlooks, Wealth Management and Asset Management. The owner intends to study the source landscape before choosing a better product.

Further extraction, historical completion and index implementation are paused under that instruction. The stage-2 work is checkpointed in local commit `ad0f30b` on `codex/research-pilot`; its incompleteness and pending reviews are preserved rather than represented as a finished pilot.

The current deliverable is [RESEARCH_PUBLICATION_MAP.md](RESEARCH_PUBLICATION_MAP.md), a single study document with official sources, producer distinctions, access observations, historical/uncertain examples and a reading worksheet. Its broader discovery does not alter the old pilot's fixed cutoff, selected streams or coverage claims. The repository's UI, financial methodology and published data are retained.
