# Adding an edition

One edition per quarter. The workflow keeps real data private until the owner has checked it.

## 1. Draft

Create `data/drafts/YYYY-qN.json` (git-ignored). It can be written by hand or with an assistant, but every call must come from the house's own public publication.

```jsonc
{
  "id": "2027-q1",
  "label": "Q1 2027",
  "cutoff": "2027-01-15",
  "status": "draft",
  "note": { "title": "Editor's note", "body": "Two or three sentences of your own reading." }, // optional
  "houses": [
    {
      "house": "jpm", // jpm | ubs | blk | gs | ms
      "source": {
        "title": "Global Asset Allocation Views 1Q 2027",
        "url": "https://...",
        "published": "2027-01-05",
      },
      "scaleObserved": { "1": "Overweight", "0": "Neutral", "-1": "Underweight" }, // optional: the wording seen in the source
      "worldview": "One sentence in your own words.",
      "keyRisk": "A short phrase.",
      "calls": [
        {
          "asset": "us-equities",
          "score": 1,
          "label": "Overweight",
          "thesis": "Why, in your words.",
          "locator": "Asset class views table",
        },
        {
          "asset": "japan-equities",
          "score": null,
          "label": null,
          "thesis": "No explicit view on Japan in this edition.",
        },
        // exactly one call for each of the 12 assets
      ],
    },
  ],
  "forecasts": [
    {
      "id": "spx",
      "name": "S&P 500",
      "sub": "Year-end 2027 target",
      "kind": "level",
      "decimals": 0,
      "unit": null,
      "spot": 7100,
      "spotAsOf": "2027-01-15",
      "values": {
        "gs": {
          "value": 8000,
          "period": "end-2027",
          "producer": "Goldman Sachs Research",
          "source": "https://...",
        },
        "blk": null,
      },
    },
  ],
  "themes": [{ "name": "AI investment and earnings", "houses": ["jpm", "ubs"] }],
}
```

Asset ids: `us-equities`, `europe-equities`, `japan-equities`, `em-equities`, `us-treasuries`, `ig-credit`, `hy-credit`, `em-debt`, `gold`, `commodities`, `us-dollar`, `cash`. Forecast kinds: `level`, `rate` (deltas in basis points), `growth` (no spot needed).

## 2. Check and preview privately

```sh
npm run validate -- --drafts   # schema, 12 calls per house, HTTPS links, dates before the cut-off
npm run dev:drafts             # the real page with your draft, red "private draft" banner
```

A draft with the same id as an existing edition replaces it in the drafts preview only.

## 3. Review

Open each source and confirm, call by call: the original label, the score mapping, the thesis wording and the date. Fix or set to `null` anything you cannot confirm. The review is yours; an assistant's extraction is a proposal, not an approval.

## 4. Publish

When you are satisfied, change `"status": "draft"` to `"published"`, move the file to `data/editions/`, and run `npm run check`. Illustrative editions can be removed from `data/editions/` once real ones exist; changes are only computed between editions of the same nature.

Deployment (GitHub Pages, manual workflow on `main`) is a separate step that only the owner triggers.
