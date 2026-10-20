# Asset-level index research proposal

Status: **research design, not an approved methodology or implemented index**. The application remains on methodology 1.0.0. Its two-stream minimum applies to descriptive counts only. This proposal requires at least three comparable institutions, but does not claim that the pilot currently meets that condition.

## Inputs and cohort

Use one predesignated primary research series per institution and the latest eligible explicit observation per asset at a stated cutoff and knowledge time. Require approved source scope, reviewed extraction and documented source-specific label mappings. Match asset universe, geography, currency, allocation reference, view type and exact horizon. Preserve source intensity but do not invent a common strength scale. No narrative sentiment model is proposed.

Missing, ambiguous, stale, withdrawn and non-comparable records contribute no vote. They remain visible in coverage. Neutral is a genuine documented category, never a fill value. A 6–12 month horizon is not an exact 12-month horizon. No numerical index is reported for N < 3. Always publish the candidate cohort, included members, observation/publication IDs and dates, exclusions and N alongside any future metric.

## Initial formulas to review

Let F, Z and U denote favorable, neutral and unfavorable counts in the same eligible cohort; N = F + Z + U; p = (F/N, Z/N, U/N). Equal institutional weights are proposed, not asset-under-management or publication-frequency weights.

- **View balance:** B = 100 × (F − U) / N, ranging from −100 to +100. B = 0 may mean unanimity at neutral or offsetting opposing views. Always show the distribution. It is a declared allocation-label balance, not holdings or expected return.
- **Categorical disagreement:** D = 150 × (1 − sum(p_k²)), ranging from 0 to 100. This measures diversity across three labels, not distance, conviction or polarization. For finite cohorts the attainable maximum depends on N. Show N; do not interpret tiny-N changes as precise trends.
- **Revisions:** report comparable pairs and their original labels first. A candidate balance change uses a fixed common membership at both cuts, requiring N_common >= 3. Separately report additions/removals. Only new explicit source views can be institutional changes. Extraction corrections are restatements, not market events; preserve original and corrected research vintages and never splice them silently.

Synthetic checks (not institutional observations):

| F / Z / U | N   | B            | D            | Interpretation                                   |
| --------- | --- | ------------ | ------------ | ------------------------------------------------ |
| 3 / 0 / 0 | 3   | 100          | 0            | Unanimous favorable labels                       |
| 0 / 3 / 0 | 3   | 0            | 0            | Unanimous neutral labels                         |
| 0 / 0 / 3 | 3   | -100         | 0            | Unanimous unfavorable labels                     |
| 1 / 1 / 1 | 3   | 0            | 100          | Maximum three-category diversity                 |
| 2 / 0 / 2 | 4   | 0            | 75           | Opposing views; different from neutral unanimity |
| 1 / 0 / 1 | 2   | Not reported | Not reported | Insufficient institutions                        |

Do not pool equities, bonds, currencies and gold into a global number. Cross-sectional metrics do not require years of history, but predictive claims, backtests and stability claims require evidence this pilot cannot supply.

## Pilot feasibility and next decision

The private diagnostic report evaluates the existing exact MVP cohort without relaxing it. Its pending human reviews, absent approved mappings and unresolved source age policies necessarily prevent an approved index. Original source contexts may also differ from the MVP's Strategic allocation reference, USD universe or 3/12-month controls. A source's numeric forecast horizon must not be reused as its allocation horizon.

After reviewing the packets, the owner can accept or revise a new versioned comparison methodology. Only then should an index contract/engine and historical compatibility be implemented. Do not change the current methodology literal, backdate platform release, normalize an unknown label or borrow a fictional fixture mapping to make the pilot produce values.
