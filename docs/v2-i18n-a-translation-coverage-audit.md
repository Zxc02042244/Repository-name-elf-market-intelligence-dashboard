# V2-I18N-A Translation Coverage Audit

This document audits current UI text that should be localized in a future i18n phase. It is documentation
only and does not change runtime UI, source adapters, API behavior, historical storage, collector code,
image assets, schedules, or secrets.

## 1. Current Translation / I18N Structure

Inspected files:

- `src/views/snapshot-explorer-view.js`
- `src/views/asset-view.js`
- `src/views/actor-view.js`
- `src/views/dashboard-view.js`
- `src/views/transactions-view.js`
- `src/views/signals-view.js`
- `src/views/analytics-view.js`
- `src/views/category-filter-view.js`
- `src/app/main.js`
- `src/app/router.js`
- `src/app/state.js`
- `src/styles.css`
- `src/themes/elf-theme.css`
- `docs/v2-product-polish-discussion-note.md`
- `docs/v2-near-term-priority-note.md`
- `docs/v2-2d1-asset-image-source-audit.md`
- `docs/v2-theme-a-elf-inspired-theme-audit.md`
- `docs/live-refresh-403-handoff.md`
- `docs/v2-6b-historical-db-pause-handoff.md`

Current state:

- The current dashboard has no active i18n module, translation dictionary, locale state, or language switch.
- Visible UI text is currently hardcoded in views and app state.
- Route parameter names in `src/app/router.js` are canonical URL keys and should not be translated.
- `src/styles.css` and `src/themes/elf-theme.css` contain styling only. No user-facing generated text was found.
- Legacy i18n files exist under `marketplace-resources-site/`, but that directory is a local legacy reference
  and must not be migrated or copied into the current app.

Languages to consider in future implementation:

- `zh-Hant`
- `en`
- `ja`
- `ko`
- `vi`

## 2. Hardcoded UI Labels By File

### `src/app/main.js`

Header and actions:

- `V2-2 Market Coverage`
- `Market Intelligence Dashboard`
- `Reusable market model foundation with Elf Continent as the first source adapter.`
- `Refreshing...`
- `Refresh Live Data`

Loading and status text:

- `Loading live market transactions...`
- `Requesting {count} coverage items.`
- `No transactions returned.`
- `Partial data loaded. Some items failed.`
- `Updated from Elf live adapter.`
- `{loaded}/{requested} items loaded, {failed} failed.`
- `{loaded}/{requested} items loaded.`
- `Token refresh failed. Live data is unavailable.`
- `Item request failed. Live data is unavailable.`
- `Unexpected API response format.`

### `src/app/state.js`

Default app status:

- `Elf Continent market coverage`
- `Loading live market transactions...`
- `Requesting market coverage seed items.`
- `Loading market data...`
- `Market model updated.`
- `Unable to build market model.`

### `src/views/dashboard-view.js`

Dashboard labels:

- `Updated`
- `Waiting for data`
- `Transactions`
- `Total Volume`
- `Active Sellers`
- `Active Buyers`
- `Model Snapshot`
- `Source`
- `Pending`
- `Latest Transaction`
- `Signal Modules`

### `src/views/category-filter-view.js`

Coverage and filter labels:

- `Asset Coverage`
- `categories`
- `Category Filters`
- `assets`
- `All`
- `Resources / Materials`
- `Blueprints / Progression`
- `Cosmetics / Collectibles`
- `Unclassified / Other`

Accessibility labels:

- `Asset category filter`
- `Top-level asset classes`
- `Asset categories`

### `src/views/analytics-view.js`

Section labels:

- `Market Activity Summary`
- `Top Traded Assets Snapshot`
- `Top Sellers Snapshot`
- `Top Buyers Snapshot`
- `Asset Class Breakdown`
- `Category Breakdown`

Helper notes:

- `Based on currently loaded live transactions. Not historical trend data.`
- `Current loaded dataset ranking by total volume, capped at 5 assets.`
- `Current loaded dataset ranking by total sold value, capped at 5 actors.`
- `Current loaded dataset ranking by total bought value, capped at 5 actors.`
- `Sorted by current loaded volume.`

Metrics and card labels:

- `Transactions`
- `Total Volume`
- `Active Sellers`
- `Active Buyers`
- `Latest Transaction`
- `Trades`
- `Volume`
- `Quantity`
- `Avg Unit`
- `Last Unit`
- `Latest`
- `Sold`
- `Bought`
- `Total Value`
- `Main Assets`
- `Last Seen`
- `trades`
- `assets`
- `shown`

Empty states:

- `No activity yet.`
- `No asset activity yet.`
- `No seller activity yet.`
- `No buyer activity yet.`
- `No assets`

### `src/views/snapshot-explorer-view.js`

Search and result labels:

- `Snapshot Search`
- `assets`
- `actors`
- `Search current loaded snapshot`
- `Search assets or actors in loaded snapshot`
- `Sort`
- `Value`
- `Activity`
- `Latest`
- `Name`
- `Search`
- `Clear Search`
- `Clear Selection`
- `Assets`
- `Actors`
- `Selected`
- `View Asset Snapshot`
- `View Actor Snapshot`
- `Showing {shown} of {total} matching {kind}.`
- `Result list is capped at {count}.`

Helper notes:

- `Search and detail views use the currently loaded MarketModel snapshot only. Not historical global search.`
- `Search results use the currently loaded marketplace snapshot. Category filters may limit visible results.`
- `Historical global search requires future historical database read support.`
- `This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase.`
- `This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase.`

Asset detail labels:

- `Snapshot Asset Stats`
- `Asset Identity / Taxonomy`
- `Asset Class`
- `Category`
- `Group`
- `Loaded Trades`
- `Loaded Volume`
- `Loaded Quantity`
- `Snapshot Avg Unit`
- `Latest Loaded Unit`
- `Latest Loaded Trade`
- `Loaded Sellers`
- `Loaded Buyers`
- `Recent Loaded Transactions`

Actor detail labels:

- `Snapshot Actor Stats`
- `Actor Identity`
- `Actor`
- `Loaded actor participation statistics`
- `Loaded Sold Count`
- `Loaded Bought Count`
- `Loaded Sold Volume`
- `Loaded Bought Volume`
- `Loaded Participation Value`
- `Loaded Main Assets`
- `Loaded Counterparties`
- `Latest Loaded Activity`
- `Recent Loaded Actor Transactions`

Empty states:

- `No {plural} match "{query}" in the current loaded snapshot.`
- `No matching {plural} in the current loaded snapshot.`
- `Selected {kind} is not available`
- `The selected {kind} is not available in the current category filter or loaded snapshot.`
- `No recent transactions.`
- `No assets`

Transaction row labels:

- `units`
- seller-to-buyer arrow text should remain symbolic or be handled by a localized transaction template.

Accessibility labels:

- `Snapshot result type`
- `Asset search results`
- `Actor search results`
- `Asset identity and taxonomy`
- `Snapshot asset statistics`
- `Actor identity`
- `Loaded main assets`
- `Loaded counterparties`

### `src/views/asset-view.js`

This view exists but is not the currently mounted detail flow. Keep it consistent for future use.

Labels and notes:

- `Snapshot Asset Stats`
- `assets`
- `Loaded Trades`
- `Loaded Volume`
- `Loaded Quantity`
- `Snapshot Avg Unit`
- `Latest Loaded Unit`
- `Latest Loaded Trade`
- `Loaded Sellers`
- `Loaded Buyers`
- `Unclassified / Other`
- `This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase.`
- `Snapshot asset stats will appear after the model is built.`

### `src/views/actor-view.js`

This view exists but is not the currently mounted detail flow. Keep it consistent for future use.

Labels and notes:

- `Snapshot Actor Stats`
- `actors`
- `Loaded Sold Count`
- `Loaded Bought Count`
- `Loaded Sold Volume`
- `Loaded Bought Volume`
- `Loaded Main Assets`
- `Loaded Counterparties`
- `Latest Loaded Activity`
- `No assets`
- `This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase.`
- `Actor stats will appear after the model is built.`

### `src/views/transactions-view.js`

Labels:

- `Recent Transactions`
- `records`
- `Quantity`
- `Total`
- `Unit`
- `Seller`
- `Buyer`
- `No transactions returned.`

Record-count templates:

- `{count} records`
- `{visible} of {total} records`

### `src/views/signals-view.js`

Labels and note:

- `Market Signals`
- `enabled`
- `No market signal modules are enabled in this phase.`

## 3. Newly Added Snapshot-safe Labels That Need Translation

The following terms are important because they prevent users from mistaking live snapshot data for historical
analysis:

- `Snapshot Asset Stats`
- `Loaded Trades`
- `Loaded Volume`
- `Loaded Quantity`
- `Snapshot Avg Unit`
- `Latest Loaded Unit`
- `Latest Loaded Trade`
- `Recent Loaded Transactions`
- `Snapshot Actor Stats`
- `Loaded Sold Count`
- `Loaded Bought Count`
- `Loaded Sold Volume`
- `Loaded Bought Volume`
- `Loaded Participation Value`
- `Loaded Main Assets`
- `Loaded Counterparties`
- `Latest Loaded Activity`
- `Recent Loaded Actor Transactions`
- `Search current loaded snapshot`
- `Search assets or actors in loaded snapshot`
- `Not historical global search`

These should be translated carefully and consistently. Do not shorten them into wording that implies 7D, 30D,
global, permanent, or historical coverage.

## 4. Buttons And Actions That Need Translation

- `Refresh Live Data`
- `Refreshing...`
- `Search`
- `Clear Search`
- `Clear Selection`
- `View Asset Snapshot`
- `View Actor Snapshot`
- `Assets`
- `Actors`
- category tab buttons such as `All`, `Fruit`, `Grain`, `Grass`, `Spice`, `Vegetable`, and future item
  categories
- sort option labels: `Value`, `Activity`, `Latest`, `Name`

Future language switch actions should also be keyed, but no switch should be implemented in this audit phase.

## 5. Helper Notes And Empty States That Need Translation

Helper notes:

- `Based on currently loaded live transactions. Not historical trend data.`
- `Current loaded dataset ranking by total volume, capped at 5 assets.`
- `Current loaded dataset ranking by total sold value, capped at 5 actors.`
- `Current loaded dataset ranking by total bought value, capped at 5 actors.`
- `Search and detail views use the currently loaded MarketModel snapshot only. Not historical global search.`
- `Search results use the currently loaded marketplace snapshot. Category filters may limit visible results.`
- `Historical global search requires future historical database read support.`
- `This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase.`
- `This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase.`

Empty states:

- `No activity yet.`
- `No asset activity yet.`
- `No seller activity yet.`
- `No buyer activity yet.`
- `No transactions returned.`
- `No recent transactions.`
- `No assets`
- `No matching {plural} in the current loaded snapshot.`
- `No {plural} match "{query}" in the current loaded snapshot.`
- `Selected {kind} is not available`
- `The selected {kind} is not available in the current category filter or loaded snapshot.`
- `Snapshot asset stats will appear after the model is built.`
- `Actor stats will appear after the model is built.`
- `No market signal modules are enabled in this phase.`

## 6. Status Messages That Need Translation

Current status messages should be keyed separately from button labels:

- `Loading live market transactions...`
- `Requesting market coverage seed items.`
- `Requesting {count} coverage items.`
- `Updated from Elf live adapter.`
- `Partial data loaded. Some items failed.`
- `Token refresh failed. Live data is unavailable.`
- `Item request failed. Live data is unavailable.`
- `Unexpected API response format.`
- `No transactions returned.`
- `Waiting for data`
- `Updated {time}`
- `{loaded}/{requested} items loaded.`
- `{loaded}/{requested} items loaded, {failed} failed.`
- `Unable to build market model.`
- `Market model updated.`

Given the current live API pause, keep `Token refresh failed` and `Live data is unavailable` distinct enough to
reuse in future unavailable/fallback states.

## 7. Category And Filter Labels That Need Translation

Top-level asset classes:

- `Resources / Materials`
- `Blueprints / Progression`
- `Cosmetics / Collectibles`
- `Unclassified / Other`

Current or expected categories:

- `All`
- `Fruit`
- `Grain`
- `Grass`
- `Spice`
- `Vegetable`
- `Other`
- future categories from Elf source metadata

Recommended rule:

- Category display labels can be localized.
- Canonical category IDs or source category keys should remain stable in data.
- If a future source adds new categories, show a safe fallback display label until translations are added.

## 8. Terms That Should Remain Untranslated

Do not translate these values:

- actor names
- transaction IDs
- item IDs
- currency codes such as `SIGIL`
- raw technical fields
- hashes
- canonical source IDs
- route parameter keys such as `mode`, `q`, `sort`, `asset`, `actor`
- source IDs such as `elf`
- raw API status kinds such as `token_refresh_failed`, `item_request_failed`, and `unexpected_api_response_format`

Item names should be treated as canonical source names for now. A future product decision can add display
aliases, but the canonical item name should remain available.

## 9. Recommended Language Keys

Use a static dictionary in a later approved phase. Suggested key groups:

```txt
app.title
app.subtitle
app.versionEyebrow
actions.refreshLiveData
actions.refreshing
actions.search
actions.clearSearch
actions.clearSelection
actions.viewAssetSnapshot
actions.viewActorSnapshot

status.loadingLiveMarketTransactions
status.requestingCoverageItems
status.updatedFromLiveAdapter
status.partialDataLoaded
status.tokenRefreshFailed
status.liveDataUnavailable
status.itemRequestFailed
status.noTransactionsReturned
status.unexpectedApiResponseFormat
status.waitingForData
status.updatedAt
status.itemsLoaded
status.itemsLoadedWithFailures

dashboard.transactions
dashboard.totalVolume
dashboard.activeSellers
dashboard.activeBuyers
dashboard.modelSnapshot
dashboard.source
dashboard.pending
dashboard.latestTransaction
dashboard.signalModules

coverage.assetCoverage
coverage.categoryFilters
coverage.assets
coverage.categories
coverage.all
coverage.assetClass.resourcesMaterials
coverage.assetClass.blueprintsProgression
coverage.assetClass.cosmeticsCollectibles
coverage.assetClass.unclassifiedOther

analytics.marketActivitySummary
analytics.topTradedAssetsSnapshot
analytics.topSellersSnapshot
analytics.topBuyersSnapshot
analytics.assetClassBreakdown
analytics.categoryBreakdown
analytics.currentLoadedDatasetVolumeNote
analytics.currentLoadedDatasetSoldNote
analytics.currentLoadedDatasetBoughtNote

snapshot.searchTitle
snapshot.searchCurrentLoadedSnapshot
snapshot.searchPlaceholder
snapshot.scopeNote
snapshot.notHistoricalGlobalSearch
snapshot.resultsCapped
snapshot.showingResults
snapshot.assetsMode
snapshot.actorsMode
snapshot.selected
snapshot.selectedUnavailableTitle
snapshot.selectedUnavailableBody

asset.snapshotStats
asset.identityTaxonomy
asset.assetClass
asset.category
asset.group
asset.loadedTrades
asset.loadedVolume
asset.loadedQuantity
asset.snapshotAvgUnit
asset.latestLoadedUnit
asset.latestLoadedTrade
asset.loadedSellers
asset.loadedBuyers
asset.recentLoadedTransactions

actor.snapshotStats
actor.identity
actor.actor
actor.loadedSoldCount
actor.loadedBoughtCount
actor.loadedSoldVolume
actor.loadedBoughtVolume
actor.loadedParticipationValue
actor.loadedMainAssets
actor.loadedCounterparties
actor.latestLoadedActivity
actor.recentLoadedActorTransactions

transactions.recentTransactions
transactions.records
transactions.recordsVisible
transactions.quantity
transactions.total
transactions.unit
transactions.seller
transactions.buyer
transactions.units

empty.noActivity
empty.noAssetActivity
empty.noSellerActivity
empty.noBuyerActivity
empty.noAssets
empty.noRecentTransactions
empty.noMatchingSnapshotResults
empty.noQuerySnapshotResults
empty.assetStatsPending
empty.actorStatsPending
empty.noMarketSignals
```

Implementation notes for a future phase:

- Keep interpolation explicit, for example `{count}`, `{loaded}`, `{requested}`, `{failed}`, `{time}`.
- Prefer short labels in cards and fuller helper notes in paragraph text.
- Keep snapshot-safe wording in every language.
- Do not add external translation services.

## 10. Recommended Next Phase

Recommended next phase:

- V2-I18N-B Translation Dictionary Skeleton

Suggested scope for V2-I18N-B:

- Add a static dictionary structure for `en`, `zh-Hant`, `ja`, `ko`, and `vi`.
- Add a small translation helper with a default locale and fallback behavior.
- Do not add a runtime translation API.
- Do not add external dependencies.
- Do not add persistence or a language switch until dictionary shape is stable.
- Start by wiring only app status/header labels or Snapshot Explorer labels if a narrower first implementation is preferred.

Recommended later phases:

1. V2-I18N-C Snapshot Explorer UI Translation
2. V2-I18N-D Dashboard / Analytics / Transactions Translation
3. V2-I18N-E Language Switch Smoke / Persistence

## 11. Non-goals

- No Supabase reads or writes.
- No service role key.
- No database write path.
- No scheduled collector.
- No GitHub Actions workflow.
- No translation API dependency.
- No external translation service.
- No runtime network translation.
- No image assets.
- No new analytics.
- No API or proxy changes.
- No MPS implementation.
- No TTS/TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.
- No migration from `marketplace-resources-site/`.
- No runtime UI changes in this audit phase.

## 12. Closeout Finding

The current dashboard is ready for a static dictionary-based i18n implementation, but it should not begin by
copying legacy translation files. The safest path is to define stable keys around the current mounted UI,
especially Snapshot Explorer, status messages, category filters, analytics panels, and recent transactions.

The highest-risk wording is snapshot-versus-history terminology. Future translations must preserve that the
current UI is based on the currently loaded `MarketModel` snapshot and is not historical global search or
7D/30D trend data.

