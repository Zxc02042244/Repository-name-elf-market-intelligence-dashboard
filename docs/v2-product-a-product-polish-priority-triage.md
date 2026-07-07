# V2-PRODUCT-A Product Polish Priority Triage

## Purpose

This document triages the next product polish options after the recent i18n, theme, search wording, asset image, QA, and documentation cleanup work.

It is documentation only. It does not change runtime UI, data flow, API behavior, database behavior, collector behavior, or build tooling.

## Current Baseline

Latest completed baseline before this triage:

```txt
V2-QA-D Current Baseline Regression Checklist
```

Current dashboard mode:

- GitHub Pages frontend
- plain HTML, CSS, and JavaScript ES modules
- loaded `MarketModel` snapshot UI
- local static i18n dictionaries
- supported locales: `en`, `zh-Hant`, `ja`, `ko`, `vi`
- locale persistence key: `marketDashboard.locale`
- Elf-inspired CSS theme
- text-first asset UI with generic CSS-only asset badges
- live API/proxy work paused
- historical DB write work paused

## Files Inspected

- `README.md`
- `docs/index.md`
- `docs/v2-product-polish-discussion-note.md`
- `docs/v2-closeout-a-near-term-safe-work-closeout.md`
- `docs/v2-qa-a-live-manual-browser-mobile-smoke-checklist.md`
- `docs/v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md`
- `docs/v2-qa-d-current-baseline-regression-checklist.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`
- `docs/v2-search-a-search-scope-wording-audit.md`
- `docs/v2-asset-c-image-source-decision.md`

## Triage Summary

The current project is stable enough for small no-secret product polish, but not for broad feature expansion.

The repeated constraint across recent phases is that the UI is still snapshot-oriented and live API/proxy work is paused. Product polish should therefore improve clarity, readability, navigation, and manual QA confidence without implying historical coverage or adding new data capabilities.

## Priority 1: Manual QA Result Discipline

Recommended status:

```txt
Highest priority when a human tester is available.
```

Why:

- V2-QA-C showed browser/mobile checks can pass in the in-app browser.
- V2-QA-D now defines the reusable regression checklist.
- Asset/actor detail checks remain limited when live data is unavailable.
- Real mobile QA is still the most direct way to catch translated label overflow and touch usability issues.

Recommended next task:

```txt
V2-QA-E Current Baseline Manual Regression Run
```

Suggested scope:

- run `docs/v2-qa-d-current-baseline-regression-checklist.md`
- record desktop and mobile results
- include `390px` and `430px`
- check all five locales
- record live API/proxy failure as acceptable if the UI remains safe
- do not modify runtime code unless a small blocking UI defect is found and explicitly approved

Risks:

- QA may be limited by the paused live API/proxy state.
- Asset and actor detail checks may remain limited if no loaded data is available.

## Priority 2: Product Copy Consistency Audit

Recommended status:

```txt
Safe next documentation phase.
```

Why:

- Search scope is already documented as loaded snapshot only.
- Snapshot-safe asset and actor labels are already applied.
- i18n has expanded visible UI copy across five locales.
- A focused copy audit can catch wording that still sounds too broad, too historical, or too technical.

Recommended next task:

```txt
V2-COPY-A Product Copy Consistency Audit
```

Suggested scope:

- inspect mounted visible labels and translated dictionary keys
- verify wording stays snapshot-safe
- verify no label implies true historical search, 7D/30D trend, or full market history
- keep neutral market-structure wording
- document issues first; only change dictionary wording if the issue is concrete and low risk

Risks:

- Over-polishing copy can create churn across all locales.
- Copy changes should not start another broad translation rewrite.

## Priority 3: Small CSS Polish From Real QA Findings

Recommended status:

```txt
Only after manual/browser findings.
```

Why:

- V2-THEME-E already added broad 390px readability safeguards.
- Additional CSS changes should be driven by actual observed issues.
- Avoid changing layout structure without a concrete defect.

Recommended next task:

```txt
V2-THEME-F Targeted Mobile Readability Fixes
```

Suggested scope:

- fix only observed overflow, spacing, wrapping, or tap-target issues
- keep changes in `src/styles.css` or `src/themes/elf-theme.css`
- re-run the V2-QA-D checklist after changes

Risks:

- CSS-only fixes can still cause visual regressions across locales.
- Long translations may require wording polish instead of layout changes.

## Priority 4: Documentation Baseline Consolidation

Recommended status:

```txt
Useful if future tasks become hard to orient.
```

Why:

- Many phase documents now exist.
- `docs/index.md` is useful but still reflects the last docs cleanup baseline rather than every latest phase as a formal release checkpoint.
- A future docs consolidation can reduce repeated rediscovery work.

Recommended next task:

```txt
V2-DOCS-D Current Baseline Phase Map Refresh
```

Suggested scope:

- update `docs/index.md` to latest stable checkpoint
- add a compact "active next options" section
- do not rewrite older phase docs
- do not change runtime code

Risks:

- Too much docs reshuffling can create noise without changing product quality.
- Keep the update short and navigational.

## Deferred: Asset Image Work

Recommended status:

```txt
Do not implement yet.
```

Current decision:

- keep text-first asset UI
- generic CSS-only badges are acceptable
- item-specific image mapping requires source/provenance approval
- official or external artwork requires explicit future approval

Next possible task only if approved:

```txt
V2-ASSET-D CSS-only Asset Badge Polish
```

Do not add:

- image files
- official artwork
- official logo assets
- external image APIs
- source-specific image URLs in views

## Deferred: Live API / Proxy Work

Recommended status:

```txt
Paused.
```

Why:

- The shared proxy blocks the GitHub Pages origin.
- This repository does not control that proxy.
- The frontend should not depend on another site's private proxy behavior.
- The frontend must not contain secrets or direct official API calls.

Next possible task only if explicitly resumed:

```txt
V2-API-A Personal Proxy Feasibility Design
```

That future task should be design-only first and should not place secrets in frontend code.

## Deferred: Historical DB Work

Recommended status:

```txt
Paused until safe secret environment is ready.
```

Why:

- Supabase schema was applied and tables were verified.
- No service role key is connected.
- No DB write test has run.
- V2-6B.5 requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in safe local/Codex secret env.

Next possible task only when secrets are safely configured:

```txt
V2-6B.5 One-item DB Write Test
```

Do not add:

- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- frontend historical UI
- 7D/30D trend UI

## Recommended Next 3 Options

1. `V2-QA-E Current Baseline Manual Regression Run`
   - best next step if browser/mobile testing is available
   - uses the existing V2-QA-D checklist
   - no code changes required unless a real defect is found

2. `V2-COPY-A Product Copy Consistency Audit`
   - best next documentation-only step
   - keeps snapshot wording honest
   - helps reduce user confusion before more polish

3. `V2-DOCS-D Current Baseline Phase Map Refresh`
   - best maintenance step if future task routing feels messy
   - updates navigation and current status
   - avoids runtime changes

## Explicit Non-goals

Do not use this triage to add:

- live API/proxy implementation
- direct official Elf/Cidi frontend API calls
- frontend `REFRESH_TOKEN`
- hardcoded `accessToken`
- Supabase reads or writes
- service role key usage
- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- historical 7D/30D UI
- external translation API
- runtime translation service
- external image API
- official artwork or logo assets
- React, Vite, npm dependencies, Webpack, or a build system
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation

## Security and Architecture Boundary

This triage does not modify:

- `src/`
- `index.html`
- `scripts/`
- `supabase/`
- `.github/workflows/`
- API/proxy behavior
- DB or Supabase code
- MarketModel shape
- source adapter behavior
- runtime UI behavior

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

The dashboard should continue to use neutral market-structure wording and should not judge player intent.

## Decision

The safest near-term product polish path is:

```txt
manual QA evidence first, copy polish second, CSS fixes only from observed issues.
```

This avoids feature creep while keeping the current snapshot dashboard clearer, more testable, and easier to maintain.
