# Market View shared rules

- Read `README.md`, `docs/METHODOLOGY.md`, `docs/EDITIONS.md` and `docs/DESIGN.md` before editing. Product UI, public docs and identifiers use English; explain progress to the owner in Spanish, in plain language.
- Direction (owner decision, 2026-10-20): one quarterly edition that reconciles one positioning voice per house on a common five-step scale, with a simple transparent consensus measure. Keep it simple first; add complexity only when the owner asks.
- Rules live in `src/domain/` (catalogue, schema, consensus maths). Presentation in `src/ui/` consumes them. Missing views stay `null`: never show them as neutral and never invent labels, numbers, dates or sources.
- Every call keeps its original wording, source title, date and HTTPS link. Theses are short paraphrases in our own words. No third-party PDFs, screenshots, logos, full texts or long quotes in Git.
- `data/editions/` is public. `data/drafts/` is private local work and must never reach a public build. Real data moves from drafts to editions only after the owner reviews it; never mark a draft as published on your own.
- Illustrative data must always show its banner and is never compared with real editions.
- The page should be beautiful and alive: be proactive with animation and visual polish, but respect reduced motion, keyboard and touch use, contrast and readable text at 390, 820 and 1440 px.
- Work on a branch and preserve existing work (the earlier foundation is in `archive/codex-foundation/` and on `codex/research-pilot`). No paid services, public deployment, permission changes, merge or push to `main` without the owner's authorisation.
- Run `npm run check` after changes, and `npm run test:browser` for user-facing changes. Report what actually ran.
