# V2-4D Snapshot Explorer Search and Selection UX Audit

This document audits the current snapshot explorer search, result list, and selection behavior. It is a
documentation-only checkpoint and does not change runtime UI, data sources, historical storage, or analytics.

## 1. Current Search Behavior

- The mounted snapshot explorer is rendered by `src/views/snapshot-explorer-view.js`.
- Search state is read from the URL hash through `src/app/router.js`.
- The search form updates the hash with:
  - `q` for search text
  - `sort` for sort mode
  - current `mode`
- Search is applied by `buildSnapshotExplorer()` in `src/core/analytics/snapshot-details.js`.
- Asset search matches currently loaded `MarketModel.assetStats` by:
  - asset name
  - category
  - asset class
  - group
- Actor search matches currently loaded `MarketModel.actorStats` by actor name only.
- Search is case-insensitive and substring-based.
- Search does not use fuzzy matching, external libraries, server queries, or historical data.

## 2. Current Result Card Behavior

- Results are rendered as compact cards in a responsive grid.
- Asset result cards show:
  - asset name
  - asset class
  - category
  - loaded trades
  - loaded volume
  - latest loaded trade
  - `View Asset Snapshot` link
- Actor result cards show:
  - actor name
  - main traded assets
  - sold count
  - bought count
  - total value
  - `View Actor Snapshot` link
- Result sets are capped at 12 entries by `RESULT_LIMIT`.
- Cards are readable, but the current UI does not expose the fact that only the top 12 matches are shown.

## 3. Current Asset Selection Behavior

- Selecting an asset writes `asset={assetId}` to the URL hash and clears `actorId`.
- Selecting an actor writes `actor={actorId}` to the URL hash and clears `assetId`.
- The selected detail is rebuilt from the currently loaded `MarketModel`.
- Asset detail currently shows:
  - asset identity / taxonomy
  - snapshot asset stats
  - recent loaded transactions
  - snapshot-only helper note
- Asset detail transaction rows are capped at 40 entries by `DETAIL_TRANSACTION_LIMIT`.
- If the selected asset or actor is not present in the current filtered `MarketModel`, no detail is rendered.
- There is no explicit visible message for a stale or invalid selected asset/actor hash.

## 4. Current Mobile Usability Findings

- Search controls collapse to one column under the existing responsive breakpoints.
- Result cards collapse from three columns to two columns and then one column.
- Asset identity and stat grids collapse safely on small screens.
- Detail transaction rows collapse to one column at tablet width.
- The current V2-4C smoke result confirmed the 390px viewport has no horizontal overflow.
- Main mobile friction is vertical length: search controls, result cards, and detail content can create a long
  scroll path without a compact selected-state summary or quick clear/back action.

## 5. Current Empty-state Behavior

- Asset search with no matches renders `No matching assets.`
- Actor search with no matches renders `No matching actors.`
- Detail transaction lists render `No recent transactions.` if no rows are available.
- There is no explicit empty state for an invalid selected hash where the asset or actor is missing from the
  current loaded snapshot.
- There is no explicit explanation that category filters can narrow the snapshot model and make a previously
  selected item unavailable.

## 6. Current Sorting And Filtering Behavior

- Sort modes are:
  - `Value`
  - `Activity`
  - `Latest`
  - `Name`
- Asset sorting maps to:
  - total volume
  - trade count
  - latest transaction time
  - asset name
- Actor sorting maps to:
  - total sold plus bought value
  - sold plus bought count
  - last seen
  - actor name
- The selected category tab filters the visible `MarketModel` before snapshot explorer search and detail logic
  run.
- Category filter state is held in app state, not in the URL hash.
- Search state is held in the URL hash.
- The two systems work together, but the UI does not clearly explain that search results are scoped to the
  currently selected category.

## 7. Problems Or Friction Points

- The 12-result cap is not visible to users.
- Selected detail can disappear silently when the selected item is not in the current filtered snapshot.
- Search and category filtering are both active, but their relationship is not explicit in the snapshot
  explorer panel.
- Asset and actor result cards use different metric labels, which is reasonable, but the mode switch could
  better clarify what is being searched.
- There is no clear way to clear the current search or selected detail besides editing the search box or using
  mode/result links.
- On mobile, selected detail can be far below the result cards after a user taps a result.
- The search form submit button is clear, but changing sort alone still requires submitting the form.
- There is no visible selected-state marker on the result card that corresponds to the open detail.

## 8. Low-risk UI Improvements For The Next Phase

Recommended next phase: V2-4E Snapshot Explorer Search UX Refinement.

Low-risk improvements:

- Add concise copy showing that search runs against the currently loaded snapshot and current category filter.
- Show a small result count such as `Showing 12 of 110 matching assets`.
- Add a clear-search link or button that resets `q` while preserving mode and sort.
- Add a clear-selection link or button that removes `asset` / `actor` from the URL hash.
- Add a visible empty state for stale or filtered-out selected assets / actors.
- Add a selected-state style to the active result card.
- Consider moving selected detail above result cards on mobile only, or add an anchor jump after selection.
- Preserve the current hash-based routing approach.
- Preserve the existing generic `buildSnapshotExplorer()` responsibility for search, sort, and detail
  selection.

These improvements should be implemented as UI clarity changes only. They should not introduce new analytics,
historical data, new APIs, or persistence.

## 9. What Should Remain Out Of Scope

- No Supabase reads or writes.
- No service role key.
- No database write path.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No 7D / 30D UI.
- No historical charts.
- No distribution charts.
- No MPS.
- No TTS / TTP.
- No Alerts.
- No Watchlist.
- No Market Health.
- No new analytics.
- No API calls in views.
- No raw API data in views.
- No changes to `src/core/` data contracts.

## 10. Audit Verdict

The current snapshot explorer is architecturally sound and uses the loaded `MarketModel` as intended. The next
improvement should focus on user orientation: visible result counts, clear selected state, clear empty states,
and better explanation that search and details are scoped to the current loaded snapshot and current category
filter. Historical storage and trend UI should remain paused until the approved V2-6 path resumes.
