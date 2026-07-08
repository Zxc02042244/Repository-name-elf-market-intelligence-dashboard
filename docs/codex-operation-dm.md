# Codex Operation DM

Use this DM when working on the Elf market intelligence dashboard. It is written from the issues already encountered in this project.

## Primary Rule

Protect the market data flow before improving the UI.

The required flow is:

```txt
source adapter -> raw source data -> normalize -> generic market transaction -> MarketModel -> analytics -> views
```

Do not make a visual change that breaks, hides, or rewrites this flow.

## API And Data State Rules

1. Keep `loadDashboard()` live-first unless the user explicitly asks for demo-only mode.
2. The correct runtime behavior is:

```txt
loadElfLiveTransactions()
  -> success: render live MarketModel
  -> failure: loadElfMockMarketTransactions() fallback
```

3. Do not conclude API recovery from visible page data alone. The page may show fallback demo data.
4. When checking API recovery, test the proxy directly and report only:

```txt
HTTP status
API code
success/failure
whether an access token exists
```

5. Never print refresh response bodies, access tokens, refresh tokens, or raw secrets.
6. Frontend may call only the Vercel proxy endpoints defined in `src/sources/elf/elf-config.js`.
7. No live API logic belongs in views.
8. No token, `REFRESH_TOKEN`, or hardcoded `accessToken` belongs in source files.

## Source Boundary Rules

1. `src/sources/elf/` owns Elf-specific API, item taxonomy, and normalization.
2. `src/core/` owns generic market model and analytics only.
3. `src/views/` renders from `MarketModel` only.
4. Views must not call `fetch`, source adapters, or large analytics calculations.
5. `index.html` stays thin: CSS links, `#app`, and module entry only.

## UI And Design Rules

1. Use `ui-ux-pro-max` only as design guidance, not as permission to overbuild.
2. Keep the dashboard dense, readable, dark, responsive, and market-focused.
3. Prefer real utility over decoration.
4. Do not copy reference images into the repo unless the user explicitly asks for asset import.
5. If the user provides an image, treat it as visual direction by default.
6. Loading, fallback, error, and updated states must be visually distinct and textually truthful.
7. The refresh button may say live refresh because it triggers live-first behavior, but body notes must not imply fallback demo data is live.
8. Preserve skip link, focus states, reduced-motion support, and no horizontal mobile scroll.

## I18n Rules

1. When adding visible text, update active locale coverage, especially `zh-Hant`.
2. Do not rely on English fallback for primary visible controls in the current UI.
3. After adding or changing text, verify the page in the selected browser locale.
4. Avoid misleading phrases such as "currently loaded live transactions" unless the state is actually live.
5. Prefer neutral wording:

```txt
currently loaded transactions
current snapshot
fallback demo snapshot
live source unavailable
```

## Verification Rules

Before reporting completion, run:

```txt
node --check on changed JS files, or all src/scripts JS for broad changes
Invoke-WebRequest http://127.0.0.1:<port>/
browser DOM check for current status text, transaction rows, nav, and console errors
375px viewport check for horizontal overflow
rg checks for token leakage and accidental assets
```

For this project, verify these signals:

```txt
No console warn/error
No unexpected blank screen
Transactions render
Status strip matches actual data state
No old misleading live note
No horizontal overflow at 375px
Views do not call APIs
Fetch stays in src/sources/elf/
```

## Git And File Hygiene

1. Do not restore deleted Markdown files unless the user explicitly asks.
2. Do not create nested project folders.
3. Do not add dependencies, bundlers, React, Vite, or build steps unless the user explicitly asks.
4. Keep documentation in `docs/` unless the user asks for root-level files.
5. Use `apply_patch` for manual edits.
6. Never revert user changes.

## Response Discipline

When reporting API status, separate these clearly:

```txt
API status
rendered page state
fallback/demo state
code behavior
```

Do not say "API is back" unless direct proxy testing succeeds.
Do not say "API is down" based only on the rendered page.
Do not remove original behavior while fixing UI copy.

## Current Known Baseline

As of the latest check:

```txt
Page loads on http://127.0.0.1:4174/
Live-first logic is restored
Refresh endpoint still falls back with token refresh unavailable
Fallback demo renders 6 transactions
Old misleading zh-Hant live note is removed
Desktop and 375px checks have no horizontal overflow
Console has no warn/error in browser check
Git status was clean before adding this DM
```
