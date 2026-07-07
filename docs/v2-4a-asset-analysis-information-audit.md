# V2-4A Asset Analysis Information Audit

This document audits the current asset/item analysis information architecture and separates what is safe in
live-only mode from what requires historical storage. It does not modify runtime UI or resume historical DB
implementation.

## 1. Current Asset Analysis Fields

Current asset-facing information appears in these places:

- `src/views/asset-view.js`
  - asset name
  - asset class
  - group / category
  - trade count
  - total volume
  - average unit value
  - latest transaction time
- `src/views/snapshot-explorer-view.js`
  - asset search by name, category, asset class, and group
  - result cards with trades, volume, and latest time
  - selected asset detail with asset class, category, group, trade count, total volume, total quantity,
    average unit value, last unit value, latest transaction time, and recent asset transactions
- `src/views/transactions-view.js`
  - recent transaction rows with asset name, group, category, quantity, total value, unit value, seller, buyer,
    and time
- `src/views/dashboard-view.js`
  - total transactions, total volume, active sellers, active buyers, latest transaction time, and source snapshot

## 2. Current Data Source For Each Field

All current fields come from the live loaded `MarketModel`.

| Field | Current source |
| --- | --- |
| Asset name | `transaction.asset.name` from normalized live source adapter data |
| Asset class | `transaction.asset.assetClass` from Elf taxonomy metadata |
| Group | `transaction.asset.group` from Elf taxonomy metadata |
| Category | `transaction.asset.category` from Elf taxonomy metadata |
| Trade count | `calculateAssetStats()` over currently loaded transactions |
| Total volume | Sum of current loaded transaction total values |
| Total quantity | Sum of current loaded transaction quantities |
| Average unit value | Current loaded total volume divided by current loaded total quantity |
| Last unit value | Unit value from latest loaded transaction for the asset |
| Latest transaction time | Max transaction time in the current loaded dataset |
| Active sellers / buyers | Unique seller / buyer counts in the current loaded dataset |
| Recent transactions | `model.transactions`, sorted by current loaded transaction time and capped in views |

## 3. Live-only Fields Safe Now

The following fields are safe in live-only mode if labels clearly state they are based on the currently loaded
live snapshot:

- Recent transactions.
- Latest unit value.
- Trade count from current loaded data.
- Total volume from current loaded data.
- Total quantity from current loaded data.
- Average unit value from current loaded data.
- Latest transaction time from current loaded data.
- Active sellers and buyers from current loaded data.
- Asset class, group, and category taxonomy labels.
- Asset search and sort across the current loaded `MarketModel`.

These fields should use wording such as:

- `Current Snapshot`
- `Currently Loaded`
- `Latest Loaded Transaction`
- `Loaded Trade Count`
- `Loaded Volume`
- `Snapshot Average Unit`

## 4. Fields That Require Historical DB

The following fields should not be shown as reliable analytics until historical storage and summary reads are
implemented:

- true 7D trend
- true 30D trend
- long-term price history
- moving average
- high / low over a historical range
- reliable distribution over time
- volatility over time
- cross-session history
- cross-device history
- permanent item price snapshots
- historical active seller / buyer counts
- historical liquidity or market depth
- historical concentration or market health

These require `market_transactions`, `price_snapshots`, and later historical summary APIs. The current
live snapshot cannot prove trends across refreshes or devices.

## 5. Fields To Hide, Relabel, Or Mark As Future

Safe relabeling guidance:

- `Avg Unit` should be treated as `Snapshot Avg Unit` or `Loaded Avg Unit`.
- `Latest` should be treated as `Latest Loaded Trade`.
- `Trades` should be treated as `Loaded Trades`.
- `Volume` should be treated as `Loaded Volume`.
- `Asset snapshot` should remain snapshot wording.

Future-only labels:

- `7D Trend`
- `30D Trend`
- `Price History`
- `Historical Volatility`
- `Historical Distribution`
- `Market Health`
- `Watchlist`

These should be hidden or marked as future until V2-6C / V2-6D provides read-only historical summaries.

## 6. Recommended Asset Analysis Layout

Recommended live-only asset detail layout:

1. Asset identity
   - asset name
   - asset class
   - category
   - group
2. Current loaded snapshot
   - loaded trades
   - loaded volume
   - total quantity
   - snapshot average unit
   - latest loaded unit
   - latest loaded transaction time
   - active sellers
   - active buyers
3. Recent transactions for this asset
   - capped transaction list
   - seller / buyer / quantity / total / unit / time
4. Future historical panel placeholder only after explicit approval
   - 7D / 30D summaries
   - price snapshots
   - historical range stats

The layout should avoid implying long-term history until the historical read API exists.

## 7. Recommended Terminology

Use precise snapshot wording:

- `Current Loaded Snapshot`
- `Loaded Transactions`
- `Snapshot Asset Stats`
- `Snapshot Average Unit`
- `Latest Loaded Unit`
- `Recent Loaded Transactions`
- `Based on currently loaded live transactions`
- `Not historical trend data`

Avoid these labels in live-only mode:

- `Trend`
- `7D`
- `30D`
- `History`
- `Historical`
- `ATH`
- `ATL`
- `Volatility`
- `Market Health`
- `Watchlist`

## 8. Non-goals

- No Supabase integration.
- No service role key.
- No database writes.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No frontend historical UI.
- No historical read API.
- No full item collection changes.
- No MPS.
- No TTS / TTP.
- No Alerts.
- No Watchlist.
- No Market Health.
- No Bubble Map.
- No Network Graph.
- No suspicion scoring.
- No low-price or related-account detection.

## 9. Audit Verdict

The current asset analysis information is safe as live snapshot analysis. It should remain clearly labeled as
current loaded data. True trend, distribution, and historical price claims should wait until historical
database writes, read-only summary APIs, and V2-6D historical trend UI are implemented.

Recommended next phase for asset analysis is a small label refinement pass, not new analytics. That pass should
rename ambiguous labels such as `Trades`, `Volume`, `Avg Unit`, and `Latest` to snapshot-safe wording if the
user approves runtime UI changes.
