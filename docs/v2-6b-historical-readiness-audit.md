# V2-6B Historical Implementation Readiness Audit

This document is an audit and planning checkpoint only. It does not implement a database, collector,
cron job, scheduled workflow, historical read API, or runtime history UI.

## Current Status

V2-6A historical storage design has been completed in `docs/v2-6a-historical-storage-design.md`.
The sanitized legacy reference checklist has been completed in `docs/legacy-reference-checklist.md`.

The current runtime remains a GitHub Pages-compatible static dashboard using plain HTML, CSS, and JavaScript
ES modules. The frontend still renders a live snapshot dataset through the existing MarketModel flow.

No `.github/workflows/` directory is present in the current repository root, so no scheduled collector or
GitHub Actions history workflow exists in the active project.

## Current Runtime Data Flow

The current runtime flow is:

```txt
index.html
-> src/app/main.js
-> src/sources/elf/elf-api.js
-> Vercel proxy
-> raw Elf transactions
-> src/sources/elf/normalize-elf-transaction.js
-> generic market transactions
-> src/core/data/market-model.js
-> src/core/analytics/*.js
-> src/views/*.js
-> dashboard UI
```

`src/app/main.js` calls `loadElfLiveTransactions()`, stores the source snapshot in app state, filters by
category when needed, and builds the visible `MarketModel` with `buildMarketModel()`.

## Architecture Boundary Check

- Views still render from `MarketModel` or from generic derived data built from `MarketModel`.
- Views do not call APIs directly.
- `fetch()` only appears in `src/sources/elf/elf-api.js`.
- `src/core/` contains generic transaction, asset, actor, totals, stats, and snapshot-detail logic.
- `src/core/` does not contain Elf proxy endpoints, token handling, official API details, `orderType` mapping, or item IDs.
- Elf-specific item IDs, taxonomy, source labels, proxy endpoints, token refresh handling, and raw transaction normalization remain in `src/sources/elf/`.
- `index.html` remains a thin static entry point.

The only minor product-label drift observed is that the page eyebrow still says `V2-2 Market Coverage` even
though later phases are complete. This is label-only and should be handled separately if desired.

## Security Boundary Check

- No frontend `REFRESH_TOKEN` value was found.
- No hardcoded `accessToken` value was found.
- The `accessToken` identifier exists only as runtime adapter state in `src/sources/elf/elf-api.js`.
- No official Elf/Cidi API endpoint appears in active frontend runtime code.
- The active frontend still calls only the existing Vercel proxy boundary.
- No `localStorage` or `sessionStorage` token persistence was found in active source.
- No database credentials, Supabase keys, service role keys, request headers, cookies, or raw auth payloads were added.
- V2-6A and legacy-reference documents mention security terms as boundary guidance only, not as secret values.

## Existing Reusable Pieces

The current implementation already has useful pieces for future historical work:

- `buildMarketModel()` accepts normalized generic transactions.
- `calculateTotals()` provides transaction count, volume, active sellers, active buyers, and latest transaction time.
- `calculateAssetStats()` provides trade count, total volume, total quantity, average unit value, last unit value, latest transaction time, active sellers, and active buyers.
- `calculateActorStats()` provides sold and bought counts, total sold and bought values, main traded assets, counterparty count, and last seen.
- `calculateBasicAnalytics()` provides current snapshot top sellers, top buyers, top assets, and breakdowns.
- `buildSnapshotExplorer()` supports snapshot asset and actor search/detail behavior.
- The source adapter already performs controlled concurrency and partial data reporting for live item coverage.

These pieces can support future 7D / 30D trend display as a presentation baseline, but they are not enough
for historical trends by themselves because there is no persisted time series, bucketed summary data, or
cross-refresh storage yet.

## Missing Pieces For Future V2-6B Implementation

Future historical implementation should add server-side pieces first:

- Database schema migration, likely from the V2-6A SQL design.
- Server-side collector code with secrets loaded only from the execution environment.
- Conservative item subset for the first collector run.
- Controlled concurrency and partial-run handling in the collector.
- Transaction dedupe using `source + item_id + transaction_id` plus fallback `raw_hash`.
- Price snapshot generation using `source + item_id + bucket_start + bucket_minutes`.
- Collector run logging.
- Manual-run path before any schedule is enabled.

Minimal future files may include:

- `supabase/schema.sql`
- `scripts/historical-collector/collector.mjs`
- `scripts/historical-collector/elf-items.mjs`
- `scripts/historical-collector/normalize-transaction.mjs`
- `.github/workflows/historical-collector.yml`

Future historical read support should be added after collector writes are proven. Minimal later frontend/API
files may include:

- A read-only historical summary API outside GitHub Pages.
- `src/sources/elf/elf-history-api.js` for summary reads if the summaries remain Elf-specific.
- `src/core/analytics/historical-summary.js` for generic summary shaping, if needed.
- `src/views/historical-summary-view.js` only after V2-6C is stable.

## Legacy Code Migration Check

The sanitized legacy reference document is documentation only. No legacy runtime history code, old local
snapshot code, old collector workflow, old large HTML, direct official API fetch implementation, or token
flow implementation was found in the active `src/` runtime.

The active project must continue to avoid copying `marketplace-resources-site/` code into runtime modules.

## Recommended Next Phase

Proceed with V2-6B only as a server-side collector prototype:

1. Add database schema migration.
2. Add a manual-only historical collector for a very small item subset.
3. Use environment secrets only.
4. Write `items`, `collector_runs`, `market_transactions`, and `price_snapshots`.
5. Keep GitHub Pages frontend unchanged.
6. Do not enable scheduled cadence until manual runs are stable.

## Explicit Non-goals

- No database implementation in this audit.
- No scheduled collector in this audit.
- No GitHub Actions collector in this audit.
- No Vercel Cron in this audit.
- No Supabase integration in this audit.
- No runtime UI changes in this audit.
- No legacy code migration in this audit.
- No MPS.
- No TTS / TTP.
- No Alerts.
- No Watchlist.
- No Market Health.
- No Bubble Map.
- No Network Graph.
- No suspicion scoring.
- No low-price or related-account detection.

## Audit Verdict

The repository is ready for a carefully scoped V2-6B server-side collector prototype, as long as the next
phase does not modify the GitHub Pages runtime first and does not introduce secrets into frontend source.

The safest next implementation step is a manual collector prototype with a small item subset and no schedule.
