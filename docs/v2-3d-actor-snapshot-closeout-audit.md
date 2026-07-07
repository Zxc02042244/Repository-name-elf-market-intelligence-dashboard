# V2-3D Actor Snapshot Closeout Audit

This document closes out the V2-3 actor/player snapshot refinement work. It is documentation only and does not
change runtime UI, source adapters, historical storage, collector code, schedules, or secrets.

## 1. Current Mounted Actor Detail Status

- The currently mounted actor detail UI is rendered by `src/views/snapshot-explorer-view.js`.
- `src/app/main.js` mounts it through `renderSnapshotExplorerView(appState.model, route, snapshotExplorer)`.
- The selected actor detail is built from the currently loaded `MarketModel` through
  `buildSnapshotExplorer()` in `src/core/analytics/snapshot-details.js`.
- Actor detail selection is stored in the URL hash with the `actor` parameter.
- The mounted actor detail now groups information into:
  - Actor Identity
  - Snapshot Actor Stats
  - Loaded Main Assets
  - Loaded Counterparties
  - Recent Loaded Actor Transactions
- The actor detail helper note clearly states that the section uses currently loaded marketplace data only and
  that true 7D/30D actor history requires the paused historical database phase.
- `src/views/actor-view.js` also uses snapshot-safe actor wording, but it is not currently mounted by
  `src/app/main.js`.

## 2. Current Actor Stats Status

Actor stats are generic snapshot calculations derived from normalized market transactions:

- `src/core/data/market-model.js` builds `actorStats` with `calculateActorStats(normalizedTransactions)`.
- `src/core/analytics/actor-stats.js` calculates:
  - actor identity
  - loaded sold count
  - loaded bought count
  - loaded sold value
  - loaded bought value
  - loaded main traded assets
  - loaded counterparty count
  - latest loaded activity
- `src/core/analytics/basic-analytics.js` uses `actorStats` to derive top loaded sellers and top loaded buyers.
- These calculations are generic and use neutral market terms. They do not contain Elf-specific API details,
  source endpoints, tokens, item IDs, or raw source response handling.

## 3. Search / Selection UX Status For Actors

- Actor search is part of the mounted Snapshot Search panel.
- Actor mode is selected with `mode=actors` in the URL hash.
- Actor search currently matches actor name only.
- Result counts are visible and make the capped result list clear.
- Actor result cards show loaded sold count, loaded bought count, and loaded participation value.
- The selected actor result card has an active selected style and marker.
- Users can clear the current search query.
- Users can clear the selected actor detail.
- If a selected actor is no longer available because of the current category filter or loaded snapshot, the UI
  shows a safe unavailable-selection state.
- Actor detail and search remain scoped to the current selected category filter and the currently loaded
  `MarketModel` snapshot.

## 4. Snapshot-Safe Wording Status

The mounted actor detail uses snapshot-safe wording:

- Snapshot Actor Stats
- Loaded Sold Count
- Loaded Bought Count
- Loaded Sold Volume
- Loaded Bought Volume
- Loaded Participation Value
- Loaded Main Assets
- Loaded Counterparties
- Latest Loaded Activity
- Recent Loaded Actor Transactions

The UI avoids historical claims. It does not describe loaded snapshot values as durable behavior, long-term
history, 7D/30D activity, or permanent player history.

## 5. Mobile Usability Status

- Actor detail sections use responsive grid layouts.
- Actor identity and actor stat cards are easier to scan on desktop and mobile.
- Loaded Main Assets and Loaded Counterparties are separated into distinct sections.
- The actor relationship layout collapses to a single column on narrow screens.
- The last V2-3C smoke test passed at a 390px viewport with no horizontal overflow.

## 6. Remaining Known Limitations

- Actor analysis is live loaded snapshot analysis only.
- Actor search only matches actor name.
- Actor result lists are capped, so they are useful for navigation but not exhaustive browsing.
- Recent loaded actor transactions are capped and do not represent full history.
- Loaded counterparty count is only the count visible in the current loaded snapshot.
- Loaded main assets are based on the current loaded transaction set only.
- Category filtering can remove an actor from the visible model if the actor has no loaded transactions in the
  selected category.
- `src/views/actor-view.js` remains unmounted and should be treated as an inactive supporting view unless a
  future phase explicitly mounts it.
- No persistent actor history, historical read API, or actor daily summary exists yet.

## 7. Future Historical Work

The following should remain future historical work until the paused V2-6 path resumes:

- true 7D actor activity
- true 30D actor activity
- cross-session actor history
- cross-device actor history
- permanent actor transaction history
- historical counterparty concentration
- historical main asset changes
- historical seller / buyer role distribution
- historical market participation changes
- durable actor-level summaries
- actor daily stats derived from historical storage
- read-only historical summary API
- historical frontend panels

These require historical `market_transactions`, optional future actor daily summaries, and a read-only
historical summary API. The current GitHub Pages frontend should not read Supabase directly with privileged
credentials.

## 8. Future V2-5 Signals Only

The following should remain future V2-5 signals design work only until explicitly approved:

- market structure signal definitions
- counterparty concentration signal design
- low-price transfer pattern design
- trading density signal design
- related-account analysis design
- alert/watchlist requirements analysis
- signal confidence and display language guidelines

These should begin as design or audit documents. They should not be implemented as scoring, enforcement, or
judgment features in the current actor snapshot scope.

## 9. Recommended Next Phase Options

1. V2-2 category / market coverage polish
   - Review taxonomy clarity, category labels, category filter behavior, and coverage gaps.
   - Keep runtime data flow and source boundaries unchanged.

2. V2-5 signals design only
   - Create a design document for future market structure signals.
   - Do not implement scoring, alerts, watchlists, or UI signal panels yet.

3. V2-6B.5 one-item DB write test only when secrets are ready
   - Resume only after `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available as server-side local/Codex
     secrets.
   - Do not paste secrets into prompts.
   - Do not commit `.env`.
   - Keep the first write test to one item and manual execution only.

## 10. Explicit Non-Goals

- No Supabase reads or writes.
- No service role key.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No 7D / 30D actor history.
- No charts.
- No related-account analysis.
- No suspicion scoring.
- No MPS implementation.
- No TTS/TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.
- No new API calls in views.
- No raw API data in views.
- No frontend secrets.
- No legacy code migration.

## 11. Security Boundary

- Frontend source must not contain `REFRESH_TOKEN`.
- Frontend source must not hardcode `accessToken`.
- Frontend source must not expose bearer tokens, service role keys, endpoint secrets, cookies, headers, or raw
  authentication payloads.
- Views must not call APIs.
- Views must not normalize raw source data.
- Views must render from `MarketModel`.
- `src/core/` must remain generic.
- Elf-specific source details must stay in `src/sources/elf/`.
- Historical database credentials must remain server-side only.

## 12. Closeout Finding

V2-3 actor/player snapshot scope can be considered stable enough to pause. The mounted actor detail UI now uses
snapshot-safe labels, clearer grouping, clear selection behavior, mobile-safe layout, and generic `MarketModel`
data. Remaining actor work should either polish categories/coverage, document future signals, or resume the
historical database path only when server-side secrets are ready.

