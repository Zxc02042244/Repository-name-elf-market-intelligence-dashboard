# V2-4F Snapshot Explorer Closeout Audit

This document closes out the V2-4 snapshot explorer and asset analysis work. It is documentation only and does
not change runtime UI, data sources, historical storage, collector code, or secrets.

## 1. Current Mounted Snapshot Explorer Status

- The currently mounted snapshot explorer is `src/views/snapshot-explorer-view.js`.
- It is mounted by `src/app/main.js` through `renderSnapshotExplorerView(appState.model, route, snapshotExplorer)`.
- The explorer renders from the currently visible `MarketModel`.
- The selected category filter is applied before the snapshot explorer receives its model.
- Search, result lists, selected details, and empty states are snapshot-only.
- Result cards and detail views do not call APIs.
- Result cards and detail views do not read raw Elf API responses.
- Result cards and detail views do not write to storage or external services.

## 2. Current Asset Analysis Status

- Asset analysis is live loaded snapshot analysis only.
- Current mounted asset detail shows:
  - asset identity / taxonomy
  - snapshot asset stats
  - recent loaded transactions
  - helper text explaining that true 7D/30D history requires the paused historical database phase
- `src/views/asset-view.js` also uses snapshot-safe labels, but it is not currently mounted by `src/app/main.js`.
- Asset stats are derived from `MarketModel.assetStats`.
- Recent asset transactions are derived from `MarketModel.transactions`.
- No historical price claims are made in the mounted asset detail UI.

## 3. Search / Selection UX Status

- Search state is stored in the URL hash via `q`.
- Result mode is stored in the URL hash via `mode`.
- Sort mode is stored in the URL hash via `sort`.
- Selected asset and actor details are stored in the URL hash via `asset` and `actor`.
- Search and detail selection are built by `src/core/analytics/snapshot-details.js`.
- Asset search matches asset name, category, asset class, and group.
- Actor search matches actor name.
- Results are capped at 12 cards.
- Detail transactions are capped at 40 rows.
- The UI now shows result counts and capped-list copy.
- The UI now provides clear search and clear selection actions.
- Active selected result cards have visible selected styling.
- Missing or filtered-out selected assets / actors now render a visible safe empty state.

## 4. Snapshot-safe Wording Status

The mounted snapshot explorer uses snapshot-safe wording for asset analysis:

- `Loaded Trades`
- `Loaded Volume`
- `Loaded Quantity`
- `Snapshot Avg Unit`
- `Latest Loaded Unit`
- `Latest Loaded Trade`
- `Loaded Sellers`
- `Loaded Buyers`
- `Recent Loaded Transactions`

The explorer also states that search and detail views use the currently loaded `MarketModel` snapshot only and
are not historical trend data.

## 5. Mobile Usability Status

- Search controls collapse to one column on smaller screens.
- Result cards collapse from three columns to two columns and then one column.
- Asset identity and stat grids collapse safely.
- Detail transaction rows collapse to one column.
- Clear actions become full-width controls on mobile.
- The V2-4E smoke test confirmed the 390px viewport remained usable with no horizontal overflow.
- The selected detail remains below result cards, which is acceptable for now but can create a longer scroll
  path on mobile.

## 6. Remaining Known Limitations

- Snapshot explorer is not historical analysis.
- Category filter state is app state only and is not stored in the URL hash.
- Sort changes still require submitting the search form.
- Search is substring-based only and does not include fuzzy matching.
- Actor search only matches actor name.
- The selected detail remains below result cards on mobile.
- Result-count calculation is duplicated lightly in the mounted view for display copy, while the capped result
  list itself remains produced by `buildSnapshotExplorer()`.
- `src/views/asset-view.js` is not currently mounted, so it should be treated as a safe but inactive view until
  the app route structure changes.
- `src/app/main.js` still has an older header eyebrow label, which is outside this V2-4 closeout scope.

## 7. What Should Remain Future Historical

The following should remain future historical work until the paused V2-6 path resumes:

- true 7D trend
- true 30D trend
- long-term price history
- permanent price snapshots
- cross-session history
- cross-device history
- historical active buyer / seller counts
- reliable historical distribution over time
- historical volatility
- historical liquidity or market depth
- historical summary API reads
- historical frontend panels

## 8. Recommended Next Phase Options

V2-4 can be considered stable enough to pause. Recommended next options are:

1. V2-3 actor/player analysis refinement
   - Improve actor-facing snapshot labels and layout.
   - Keep everything based on the loaded `MarketModel`.
   - Do not add suspicion scoring or account-relationship claims.

2. V2-2 market coverage/category polish
   - Review item taxonomy, category naming, and category filter clarity.
   - Keep item IDs and taxonomy in `src/sources/elf/`.

3. V2-5 signals design only
   - Produce a design document for future signals.
   - Do not implement MPS, TTS/TTP, Alerts, Watchlist, or Market Health yet.

4. V2-6B.5 DB write test only when secrets are ready
   - Resume only when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available as server-side secrets.
   - Run one-item manual write test only.
   - Do not add schedule or frontend historical UI in that phase.

## 9. Explicit Non-goals

- No Supabase reads or writes.
- No service role key.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No 7D / 30D UI.
- No charts.
- No historical frontend UI.
- No MPS implementation.
- No TTS / TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.
- No new API calls in views.
- No raw API data in views.
- No changes to `src/core/` data contracts.

## 10. Closeout Verdict

V2-4 Snapshot Explorer can be paused as stable for the current live snapshot scope. The implemented explorer
supports snapshot search, result counts, selected detail views, clear actions, safe empty states, snapshot-safe
labels, and mobile-safe layout without weakening the project architecture boundary.

Future work should either refine actor/player snapshot UX, polish taxonomy/category coverage, design signals
without implementing them, or resume V2-6B.5 only when server-side Supabase secrets are ready.
