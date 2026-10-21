# Methodology

Market View compares the published asset-allocation calls of large investment houses. The rules below are deliberately simple so that a reader can check every number on the page by hand.

## 1. One voice per house

Each banking group speaks through several teams:

| Voice                      | Writes for            | Typically gives                                    | Typical cadence            |
| -------------------------- | --------------------- | -------------------------------------------------- | -------------------------- |
| Research (investment bank) | Institutional clients | Forecasts: growth, inflation, rates, index targets | Annual + mid-year outlooks |
| Wealth management (CIO)    | Private clients       | Explicit over/underweights by asset class          | Monthly                    |
| Asset management           | Fund clients          | Tactical allocation views, long-run assumptions    | Quarterly                  |

For **positioning** we use exactly one voice per house: the team that publishes an explicit allocation table. That gives every house one vote. Current choices (see `src/domain/catalog.ts`):

| House          | Voice used for positioning                                                |
| -------------- | ------------------------------------------------------------------------- |
| J.P. Morgan    | Asset Management, Multi-Asset Solutions — Global Asset Allocation Views   |
| UBS            | Global Wealth Management, Chief Investment Office — House View            |
| BlackRock      | BlackRock Investment Institute — tactical views                           |
| Goldman Sachs  | Wealth Management, Investment Strategy Group — Outlook and tactical tilts |
| Morgan Stanley | Wealth Management, Global Investment Committee — On the Markets           |

**The numbers** (index targets, yields, macro forecasts) may come from any arm of the group, usually Research; each value records its producer and period when known.

## 2. One common scale

Every original label maps to five steps: −2 strong underweight, −1 underweight, 0 neutral, +1 overweight, +2 strong overweight. A house that only uses three steps maps to −1/0/+1. The original wording ("Attractive", "Equal weight", "Tactical overweight") is stored with every call and shown in the detail panel; the mapping per house is printed in the Method section.

Only explicit allocation labels are mapped. Narrative optimism ("attractive valuations", "bullish") is not an overweight unless that word _is_ the house's allocation scale. A macro forecast is never turned into an allocation.

## 3. Missing is missing

When a publication states no explicit view on an asset, the call is `score: null` with the reason in its thesis. It is shown hatched ("No view published"), excluded from counts and averages, and never shown as neutral.

## 4. The consensus measure

For each asset, over the houses with an explicit view:

- **Counts**: how many are overweight (any positive score), neutral and underweight.
- **Average call**: the mean score on the −2…+2 scale (the ◆ marker).
- **Agreement**: the share of houses in the largest of the three groups.

The verdict follows in this order (`src/domain/consensus.ts`):

1. Fewer than 3 explicit views → **Too few views**.
2. Agreement ≥ 80% → **Consensus overweight / underweight / neutral**.
3. Average ≥ +0.3 → **Leaning overweight**; average ≤ −0.3 → **Leaning underweight**.
4. Neutral is the largest group with ≥ 60% → **Mostly neutral**.
5. Otherwise → **Split**.

"Strongest consensus" is the asset with the highest agreement on a non-neutral side (ties: fewer opposing votes, then larger average). "Biggest split" is the lowest agreement (ties: larger dispersion). The measure describes published labels from our five houses. It is not a market-wide consensus, a portfolio or a recommendation.

## 5. Editions and freshness

We publish one edition per quarter with a cut-off date. For each house we take its **latest publication on or before the cut-off**, whatever its own cadence, and show that publication's date. Sources older than 75 days at the cut-off are flagged as old. Publication cadence is not the forecast or allocation horizon.

## 6. Changes

Changes compare each house's call with its call in the previous edition: upgrade, downgrade, new view or dropped view. Illustrative editions are never compared with real ones.

## 7. Sources and usage

Each call carries the publication title, date, an HTTPS link to the official page and, when available, a locator (section or table). Theses are one-line paraphrases in our own words. We do not copy charts, logos, full texts or long quotations, and we do not store third-party PDFs in the repository.

Real data enters `data/editions/` only after the owner has reviewed the draft. See [EDITIONS.md](EDITIONS.md).
