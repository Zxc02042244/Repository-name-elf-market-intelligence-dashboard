# Project Documentation Index

## Current Baseline

Latest closeout:

```txt
V2-DOCS-C Targeted Documentation Cleanup
```

Latest reviewed baseline before this cleanup:

```txt
14bd1f17e38d48c28269a64f37245345bd31edb6
```

Current product mode:

- GitHub Pages frontend
- plain HTML, CSS, and JavaScript ES modules
- skin gallery runtime plus a modular market feature with a reserved data-source boundary
- local static i18n dictionaries
- Elf-inspired CSS theme
- text-first asset UI with generic CSS-only asset badges

Paused lines:

- live API/proxy work
- historical DB write work unless safe secret env is configured
- scheduled collection
- asset image mapping and official artwork

## Core Project References

- `AGENTS.md`
- `CODEX_MARKET_INTELLIGENCE_DASHBOARD_BRIEF.md`
- `CHECKLIST.md`
- `src/config/README.md`
- `src/features/skins/README.md`
- `src/features/market/README.md`
- `docs/elf-skin-self-edit-guide.md`

## Current Safe-work Closeouts

- `docs/v2-closeout-a-near-term-safe-work-closeout.md`
- `docs/v2-qa-a-live-manual-browser-mobile-smoke-checklist.md`
- `docs/v2-qa-b-live-pages-deployment-smoke-closeout.md`
- `docs/v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md`
- `docs/v2-qa-d-current-baseline-regression-checklist.md`
- `docs/v2-docs-b-encoding-legacy-doc-cleanup-audit.md`
- `docs/v2-docs-c-targeted-documentation-cleanup.md`
- `docs/local-static-preview-workflow.md`

Use these first when deciding the next no-secret UI or documentation task.

## Market Indicator Specifications

- docs/tts-two-step-transfer-spec.md
  - Two-Step Transfer Confidence（TTS）的已找回概念與安全語言規範
  - 目前僅完成紀錄，尚未啟用計算或畫面
- docs/mps-market-pattern-score-spec.md
  - Market Pattern Score（MPS）的六個構面、可解釋性及安全語言規範
  - Market Pattern Index（MPI）為待確認的改名提案
  - 目前僅完成紀錄，尚未啟用計算或畫面

## I18N Track

- `docs/v2-i18n-a-translation-coverage-audit.md`
- `docs/v2-i18n-b-translation-dictionary-skeleton.md`
- `docs/v2-i18n-c-snapshot-explorer-wiring.md`
- `docs/v2-i18n-d-language-switch-persistence.md`
- `docs/v2-i18n-e-full-visible-ui-translation-wiring.md`
- `docs/v2-i18n-f-manual-translation-qa-checklist.md`
- `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`

Current i18n state:

- supported locales: `en`, `zh-Hant`, `ja`, `ko`, `vi`
- locale persistence key: `marketDashboard.locale`
- source data remains intentionally untranslated

Known note:

- V2-I18N-G completed as translation polish, but no standalone V2-I18N-G document is present.
- V2-I18N-F locale display text was verified as valid UTF-8; earlier corrupted output was a terminal display issue.

## Theme / Mobile Track

- `docs/v2-theme-a-elf-inspired-theme-audit.md`
- `docs/v2-theme-b-theme-tokens-prototype.md`
- `docs/v2-theme-c-snapshot-explorer-theme-pass.md`
- `docs/v2-theme-d-mobile-readability-smoke.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`

Current theme state:

- generic layout styles: `src/styles.css`
- Elf-inspired theme tokens: `src/themes/elf-theme.css`
- V2-QA-C browser/mobile interactive smoke passed for page load, locale switching, persistence, search, Clear Search, refresh failure state, and narrow viewport overflow checks
- asset/actor detail selection with live data remains limited by the current paused live API/proxy state

## Search / Snapshot Explorer Track

- `docs/v2-search-a-search-scope-wording-audit.md`
- `docs/v2-4d-snapshot-explorer-search-selection-audit.md`
- `docs/v2-4f-snapshot-explorer-closeout-audit.md`

Current search state:

- search is current loaded snapshot search only
- asset search covers name, category, assetClass, and group
- actor search covers actor name
- transaction rows are not directly searched
- historical global search is not available

## Asset Image Track

- `docs/v2-2d1-asset-image-source-audit.md`
- `docs/v2-asset-b-asset-image-source-follow-up-audit.md`
- `docs/v2-asset-c-image-source-decision.md`

Current asset image decision:

- keep asset UI text-first
- generic CSS-only asset badges are allowed and currently implemented
- item-specific image mapping requires source/provenance approval
- Elf-specific image mapping belongs in `src/sources/elf/`

## Actor / Asset Analysis Tracks

- `docs/v2-3a-actor-analysis-information-audit.md`
- `docs/v2-3d-actor-snapshot-closeout-audit.md`
- `docs/v2-4a-asset-analysis-information-audit.md`
- `docs/v2-4f-snapshot-explorer-closeout-audit.md`

Current analysis state:

- asset and actor detail views are loaded snapshot only
- no true 7D/30D history
- no suspicion scoring
- no related-account analysis
- neutral market-structure language only

## Historical DB Track

- `docs/v2-6a-historical-storage-design.md`
- `docs/v2-6b-historical-readiness-audit.md`
- `docs/v2-6b-manual-collector-prototype-design.md`
- `docs/v2-6b-historical-db-pause-handoff.md`
- `supabase/schema.sql`
- `supabase/README.md`

Current historical state:

- Supabase schema was manually applied.
- Verified tables were documented:
  - `collector_runs`
  - `items`
  - `market_transactions`
  - `price_snapshots`
- No service role key should be committed.
- One-item DB write test requires safe local/Codex secret env first.

## Live API / Proxy Track

- `docs/live-refresh-403-handoff.md`

Current live API state:

- shared proxy blocks the GitHub Pages origin
- active proxy repository is not controlled by this project
- do not depend on another site's private proxy behavior
- do not put tokens in frontend

## Legacy Reference Track

- `docs/legacy-reference-checklist.md`

Current legacy state:

- legacy material is documentation/reference only
- do not copy legacy site as one large file
- do not migrate old API/auth/token flow

## Recommended Next Safe Options

1. Use `docs/v2-qa-d-current-baseline-regression-checklist.md` after each small docs, CSS, i18n, or UI polish change.
2. Repeat V2-QA-C style browser/mobile smoke after future CSS or i18n changes.
3. Use `scripts/serve-static.mjs` for local static preview smoke:
   - `node scripts/serve-static.mjs .`
   - `http://127.0.0.1:4173/`
4. Keep CSS-only asset badges generic and source-data based.
5. Plan personal proxy feasibility only if live API work is explicitly resumed.
6. Resume V2-6B.5 one-item DB write test only when safe Supabase secret env is configured.

## Explicit Non-goals

Do not add without explicit approval:

- frontend `REFRESH_TOKEN`
- hardcoded `accessToken`
- official direct Elf/Cidi frontend API calls
- external translation API
- runtime translation service
- external image API
- official artwork or logo assets
- scheduled collector
- GitHub Actions collector workflow
- Vercel Cron
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation
