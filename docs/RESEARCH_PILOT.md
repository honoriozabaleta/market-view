# Private research pilot

## Fixed scope and storage

The owner selected five candidates, the complete publicly discoverable publication sequence in the selected series from 2026-07-01 through a fixed Q4 cutoff, macro as well as asset extraction, and asset/context-specific index research. The initial cutoff is **2026-10-20T15:59:53Z**. Later retrievals increase the knowledge horizon, not the source-publication cutoff. All discovery is bounded by available official pages, archives and searches; gaps are not proof that an edition did not exist.

`data/candidates/research-pilot.json` is the shareable bibliographic inventory, including attempts, failures and primary versus auxiliary series. It contains no financial extraction or usage approval. `.local/research-pilot/inventory.json` is its local working copy. Extraction packages and rendered review files live under that ignored workspace. They are never imported by the application; Vite rejects `.local` imports. Original documents may be consulted privately, never committed. Review Markdown escapes source strings instead of rendering external HTML.

## Contracts and compatibility

`ResearchInventorySchema` records institution/team/series identities, independent publication versions, exact or unknown dates, retrieval times, capture kind, access outcomes, predecessor links and gaps. Only one primary series per institution is allowed. Auxiliary publications are separately identified and cannot silently replace the primary comparison stream.

`ResearchPackageSchema` reuses the existing exported publication, asset observation, citation and review types. Every asset extraction has original context and a pending unnamed review. All eight catalog assets receive an extraction audit, including inaccessible/ambiguous content. Structured horizon bounds supplement the original horizon without converting an interval to an exact month count. Publication and observation release dates remain null; normalized stances and mappings remain null in this pilot.

`MacroObservationSchema` keeps topic, geography, original scenario and probability if explicitly stated, claim-specific evidence, risks/catalysts, and a point or interval forecast with unit, target period, measurement basis and source as-of date. Unknown bases or target periods stay null and prevent a defensible future aggregate. No GDP/inflation entry is forced into an asset ID. Missing topics are omissions in coverage, not neutral forecasts.

The existing single-publication draft importer is unchanged. A research packet may contain an optional equivalent legacy draft, but it is null when mandatory legacy fields (such as a reviewed age policy) cannot be supplied honestly. This is deliberate: the current Dataset contract requires a positive numeric `staleAfterDays`; the research inventory permits a pending null policy. Do not fabricate a 100-day policy to create a legacy export.

## Local commands and review

1. Prepare `.local/research-pilot/inventory.json` and a `packages/` directory. Each `read` inventory entry must have one matching packet; metadata-only and blocked entries must not have extracted claims.
2. Use `npm run research:import -- input.json .local/research-pilot` to validate and exclusively save one package. Inputs must match their inventory identity, version, dates and source URL. The command never overwrites.
3. Run `npm run research:validate -- .local/research-pilot` to validate the complete workspace and references. The regular check validates the tracked inventory and, if present, this local workspace too.
4. Run `npm run research:review -- .local/research-pilot` for dated private output, or supply a new private output directory as the second argument. Every packet gets an English evidence-linked Markdown sheet. README and diagnostics JSON include the inventory, search/gap log, both reconstructed cuts, an eight-asset matrix and chronological extraction events. Repeat runs never overwrite a review.
5. Review one calibration publication per accessible institution before treating further extraction as calibrated. An unavailable institution remains a documented gap. No human calibration is inferred from the request to implement this workflow.

The Q3 cut is 2026-09-30T23:59:59.999Z; the Q4 cut is the fixed source cutoff. Knowledge time is the actual review generation instant. These are private reconstructed research diagnostics, not saved platform snapshots. Publication month precision is conservative. Undated records remain visible in inventory but do not enter a latest selection. Per-asset supersession preserves omitted earlier observations; later unread material qualifies any latest-extracted label. Unresolved age policy is shown explicitly.

The timeline lists extracted labels and omissions without claiming that label differences are genuine investment-view changes. No reviewed normalizations exist yet. Extraction-correction predecessor links are labeled separately; no correction becomes an institutional event. This preserves the distinction between recording an observation and approving a financial comparison.

## Source usage and next gate

All source assessments and editorial reviews remain pending. Links/public access do not establish reuse permission. Public documents, transcript text, charts and PDFs are not included in Git. Any actual promotion needs an owner-assessed usage scope, real review identities/times and explicit release times through the existing procedure in [DATA_UPDATES.md](DATA_UPDATES.md). The private report is the review artifact, not a client-side admin panel.

See [INDEX_RESEARCH.md](INDEX_RESEARCH.md) for hypotheses; no index engine, live monitoring or public deployment is part of this delivery. Discovery totals and actual verification results are recorded after extraction in this document.

## Initial discovery and extraction record — 2026-10-20

The initial workspace has **13 bibliographic references/access targets**, **7 readable capture packages**, **15 asset observations** and **44 macro entries** across five institutions and nine separately named series. The references include three metadata-only entries and three blocked/redirected targets; they are not thirteen fully recovered reports. One captured annual-outlook web introduction is an antecedent outside the July window. The BlackRock Global Insights companion is auxiliary and never substitutes for its primary weekly series.

The primary series selected for research diagnostics are JPMorgan MAS Global Asset Allocation Views, UBS CIO Weekly Global, BlackRock Global Weekly Commentary, Goldman ISG Live Market Insights and Morgan Stanley GIC On the Markets. These are explicit pilot choices for owner review, not claims of an institution's sole or comprehensive house view. Monthly letters, Annual Outlook, InBrief and the Global Insights companion remain separate auxiliary series.

The workspace records nine specific coverage gaps. It does **not** establish a complete July–October publication sequence. Key findings:

- JPMorgan's generic link is indexed as Q3 but directly serves Q4. The Q3 title/date is bibliography only; no old positions are reconstructed from the new text.
- UBS's weekly URL directly serves October 19 while older search rendering describes October 12. Global Monthly Letter editions for July–October were not recovered; US advisor livestream summaries are a different product.
- BlackRock's corporate archive exposes no dated list in the retrieved page. The PDF link leads to attestation and regional variants present terms. No terms acceptance or access-control bypass was performed; current readable prose and a separately dated companion article are retained.
- Goldman ISG's readable July episode summary and January outlook introduction do not establish full transcript/report coverage. The linked InBrief date/content were not recovered from its redirect.
- Morgan Stanley's official advisor page names a July issue but its report link now serves October. The October PDF has month-only publication precision and tables explicitly as of July 1. It remains reviewable but cannot enter an October 20 exact-date selection under the existing conservative rule. Its cited GIR/guest material was not silently attributed to GIC.

Each packet explicitly identifies unread linked material or exhibits and unresolved comparability. No calibration approval has been received. The next research batch should address the documented archive/version and scope questions with the owner, rather than assume the current seven captures close all history gaps. Neither cut supplies three approved, mapped institutions for an index. This is an honest diagnosis, not a reason to relax the contracts.
