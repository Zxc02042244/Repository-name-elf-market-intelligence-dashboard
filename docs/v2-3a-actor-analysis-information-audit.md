# V2-3A Actor Analysis Information Audit

This document audits the current actor/player analysis information architecture before any UI or analytics
changes. It is documentation only and does not add runtime UI changes, new analytics, historical storage,
database writes, schedules, or secrets.

## 1. Current Actor / Player Analysis Fields

Actor-facing information currently appears in these places:

- `src/views/snapshot-explorer-view.js`
  - actor search result cards
  - selected actor detail
  - recent actor transactions
- `src/views/actor-view.js`
  - actor stat cards, but this view is not currently mounted by `src/app/main.js`
- `src/views/dashboard-view.js`
  - active sellers
  - active buyers
- `src/views/transactions-view.js`
  - seller name
  - buyer name
- `src/core/analytics/basic-analytics.js`
  - top sellers
  - top buyers
- `src/core/analytics/actor-stats.js`
  - generic actor statistics used by the model

Current actor fields include:

- actor name
- sold count
- bought count
- total sold value
- total bought value
- main traded assets
- counterparty count
- last seen
- recent actor transactions
- active sellers
- active buyers

## 2. Current Data Source For Each Field

All current actor/player fields come from the currently loaded `MarketModel`.

| Field | Current source |
| --- | --- |
| Actor name | `transaction.actors.seller.name` and `transaction.actors.buyer.name` from normalized transactions |
| Sold count | `calculateActorStats()` over currently loaded transactions |
| Bought count | `calculateActorStats()` over currently loaded transactions |
| Total sold value | Sum of sold transaction values in currently loaded transactions |
| Total bought value | Sum of bought transaction values in currently loaded transactions |
| Main traded assets | Top three assets by loaded actor transaction count |
| Counterparty count | Unique counterparties in currently loaded transactions |
| Last seen | Latest loaded transaction time for the actor |
| Recent actor transactions | Current `model.transactions` filtered by selected actor id and capped at 40 |
| Active sellers | Unique seller ids in the currently loaded model |
| Active buyers | Unique buyer ids in the currently loaded model |
| Top sellers | Top five actor stats by loaded sold value, count, and last seen |
| Top buyers | Top five actor stats by loaded bought value, count, and last seen |

## 3. Live Snapshot-safe Fields

The current loaded `MarketModel` can safely support these actor/player fields if wording makes the snapshot
scope clear:

- loaded sold count
- loaded bought count
- loaded sold volume
- loaded bought volume
- loaded total participation value
- loaded counterparties
- loaded main traded assets
- latest loaded activity
- recent loaded actor transactions
- loaded active sellers
- loaded active buyers
- top loaded sellers
- top loaded buyers

These fields describe only the current loaded live snapshot. They should not imply persistent or long-term
player behavior.

## 4. Fields That Require Historical DB

The following require historical storage before they are trustworthy:

- true 7D player activity
- true 30D player activity
- long-term trading behavior
- reliable trend over time
- cross-session actor history
- cross-device actor history
- permanent actor transaction history
- historical counterparty concentration
- historical main asset changes
- historical seller / buyer role distribution
- historical market participation changes
- durable actor-level summaries

These require `market_transactions`, future actor daily summaries, and read-only historical summary APIs. The
current live snapshot cannot prove durable behavior across refreshes, sessions, or devices.

## 5. Current Actor Search Behavior

- Actor search is part of the mounted snapshot explorer.
- Search state is stored in the URL hash through `q`.
- Actor mode is stored in the URL hash through `mode=actors`.
- Search is applied by `buildSnapshotExplorer()` in `src/core/analytics/snapshot-details.js`.
- Actor search currently matches actor name only.
- Actor search is case-insensitive and substring-based.
- Actor results are sorted by:
  - value
  - activity
  - latest
  - name
- Actor results are capped at 12 entries.
- Actor result counts are displayed by the mounted snapshot explorer.
- Actor search is scoped to the current loaded `MarketModel`, including the current category filter.

## 6. Current Actor Detail Behavior

- Actor detail is selected through the URL hash with `actor={actorId}`.
- Selected actor detail is built by `getActorDetail()` in `src/core/analytics/snapshot-details.js`.
- Selected actor detail uses `model.actorStats` and `model.transactions`.
- Recent actor transactions are capped at 40 rows.
- If the selected actor is not present in the current filtered snapshot, a safe unavailable selection state is
  rendered.
- The current mounted actor detail shows:
  - sold count
  - bought count
  - total sold
  - total bought
  - main assets
  - counterparties
  - last seen
  - recent actor transactions
- Current mounted actor detail labels are mostly functional but less explicitly snapshot-safe than the asset
  detail labels.

## 7. Current Top Sellers / Top Buyers Status

- Top sellers and top buyers are calculated in `src/core/analytics/basic-analytics.js`.
- Top sellers are based on loaded `totalSoldValue`, then loaded `soldCount`, then `lastSeen`.
- Top buyers are based on loaded `totalBoughtValue`, then loaded `boughtCount`, then `lastSeen`.
- The calculations are generic and based on `actorStats`.
- They represent current loaded snapshot rankings only.
- They should be labeled as loaded snapshot rankings, not historical leaderboards or durable player behavior.

## 8. Current Limitations

- Actor/player analysis is live snapshot only.
- Actor search matches name only, not main assets or counterparties.
- Actor detail labels are not as snapshot-explicit as the asset detail labels.
- `src/views/actor-view.js` is not mounted by `src/app/main.js`.
- Category filter can remove an actor from the visible model if the actor has no transactions in that category.
- Counterparty count is loaded snapshot-only and should not be treated as long-term concentration.
- Main traded assets are based on loaded transaction counts only.
- Recent actor transactions are capped at 40 and do not represent full history.
- No persistent actor history exists yet.
- No historical read API exists yet.

## 9. Recommended Actor / Player Analysis Layout

Recommended live snapshot actor detail layout:

1. Actor identity
   - actor name
   - current snapshot role summary
2. Loaded participation stats
   - loaded sold count
   - loaded bought count
   - loaded sold volume
   - loaded bought volume
   - loaded total participation value
   - latest loaded activity
3. Loaded market relationships
   - loaded counterparties
   - loaded main traded assets
4. Recent loaded actor transactions
   - asset
   - quantity
   - total value
   - role or seller/buyer context
   - counterparty
   - time
5. Future historical panel only after explicit approval
   - 7D / 30D actor activity
   - durable counterparty summaries
   - historical participation changes

This layout should stay neutral and should not imply intent, enforcement, or long-term behavior.

## 10. Recommended Snapshot-safe Wording

Recommended wording:

- `Loaded Sold Count`
- `Loaded Bought Count`
- `Loaded Sold Volume`
- `Loaded Bought Volume`
- `Loaded Participation Value`
- `Loaded Counterparties`
- `Loaded Main Assets`
- `Latest Loaded Activity`
- `Recent Loaded Actor Transactions`
- `Top Loaded Sellers`
- `Top Loaded Buyers`
- `Based on currently loaded live transactions`
- `Not historical trend data`

Avoid wording that implies durable or historical analysis before V2-6 historical reads exist:

- `7D Activity`
- `30D Activity`
- `Trend`
- `History`
- `Long-term`
- `Suspicious`
- `Violation`
- `Alt account`
- `Related account`
- `Market Health`
- `Watchlist`

## 11. Recommended Next Phase

Recommended next phase: V2-3B Actor Analysis Snapshot Label Refinement.

Suggested scope:

- Refine mounted actor detail labels in `src/views/snapshot-explorer-view.js`.
- Add concise helper text that actor/player fields are based on the currently loaded snapshot.
- Group actor detail into identity, loaded participation stats, loaded market relationships, and recent loaded
  actor transactions.
- Keep all calculations in existing generic analytics.
- Do not add new analytics.
- Do not add historical UI.
- Do not add Supabase reads or writes.
- Do not add MPS, TTS/TTP, Alerts, Watchlist, or Market Health.

## 12. Audit Verdict

The current actor/player information architecture is safe for live snapshot analysis. The generic
`actorStats`, `totals`, and `basicAnalytics` modules already provide useful loaded actor participation fields.
The next improvement should be a UI wording and layout pass, not a new analytics or historical data phase.
