# Codex Brief: Reusable Market Intelligence Dashboard

Use Project Standing Rules.

This is a new GitHub repository for a **Reusable Market Intelligence Dashboard**.

The first implementation targets **Elf Continent marketplace data**, but the architecture must not be Elf-only. Elf Continent should be implemented as the first source adapter.

---

## 1. Product Direction

Build a reusable market intelligence dashboard.

Long-term idea:

```txt
Generic market intelligence core
+
Elf Continent as the first data source
```

Do not build the core as a one-off Elf-only dashboard.

The first goal is not maximum features. The first goal is a clean, stable, reusable data flow.

---

## 2. Hard Architecture Rules

These rules are strict.

```txt
1. Frontend must not contain REFRESH_TOKEN.
2. Frontend must not hardcode accessToken.
3. Frontend must not call the official Elf API directly.
4. Frontend must call the existing Vercel proxy only.
5. Raw API data must be normalized before use.
6. Views must not read raw API data directly.
7. Views must not perform major analytics calculations.
8. MarketModel is the primary data source for views.
9. Elf-specific logic must stay inside src/sources/elf/.
10. Generic analytics must stay inside src/core/.
11. Do not copy the legacy website as one large file.
12. Do not add MPS, TTS/TTP, Alerts, Watchlist, or full legacy UI in V2-1.
```

Core principle:

```txt
Rules should protect architecture, not freeze implementation.
```

---

## 3. Flexible Design Rules

These are preferred directions, not rigid locks.

Codex may adjust implementation details if needed, as long as the architecture boundaries remain intact.

Flexible areas:

```txt
1. Exact transaction object nesting
2. Exact field names inside generic model
3. UI card layout
4. Table vs card rendering
5. Minor folder naming if justified
6. Internal analytics formulas in later phases
7. How long legacy compatibility fields are retained
```

However, if any adjustment weakens the data flow boundary, do not make it.

Required data flow:

```txt
source adapter
  -> raw source data
  -> normalize
  -> generic market transaction
  -> MarketModel
  -> analytics
  -> views
```

---

## 4. API Source

Use the existing Vercel proxy:

```txt
POST https://elf-market-api.vercel.app/api/refresh
GET  https://elf-market-api.vercel.app/api/price?itemId={itemId}&accessToken={token}
```

Rules:

```txt
- Do not expose REFRESH_TOKEN in frontend code.
- Do not call the official Elf API directly from frontend code.
- Do not put accessToken in source files.
- All live Elf API calls must be isolated in src/sources/elf/elf-api.js.
```

---

## 5. Required Runtime Data Flow

```txt
GitHub Pages
  -> index.html
  -> src/app/main.js
  -> src/sources/elf/elf-api.js
  -> Vercel proxy
  -> raw Elf transactions
  -> src/sources/elf/normalize-elf-transaction.js
  -> generic market transactions
  -> src/core/data/market-model.js
  -> src/core/analytics/*.js
  -> src/views/*.js
  -> Dashboard UI
```

One-sentence rule:

```txt
API fetches data, source adapter normalizes it, core builds the model, views render the model.
```

---

## 6. Required Project Structure

Create this structure:

```txt
market-intelligence-dashboard/
│
├─ index.html
├─ README.md
├─ .nojekyll
├─ CODEX_MARKET_INTELLIGENCE_DASHBOARD_BRIEF.md
│
└─ src/
   ├─ app/
   │  ├─ main.js
   │  ├─ state.js
   │  └─ router.js
   │
   ├─ core/
   │  ├─ data/
   │  │  ├─ market-model.js
   │  │  └─ normalize-contract.js
   │  │
   │  ├─ analytics/
   │  │  ├─ totals.js
   │  │  ├─ asset-stats.js
   │  │  ├─ actor-stats.js
   │  │  └─ signals.js
   │  │
   │  └─ utils/
   │     ├─ numbers.js
   │     └─ time.js
   │
   ├─ sources/
   │  └─ elf/
   │     ├─ elf-config.js
   │     ├─ elf-items.js
   │     ├─ elf-api.js
   │     └─ normalize-elf-transaction.js
   │
   ├─ views/
   │  ├─ dashboard-view.js
   │  ├─ transactions-view.js
   │  ├─ asset-view.js
   │  ├─ actor-view.js
   │  └─ signals-view.js
   │
   ├─ themes/
   │  └─ elf-theme.css
   │
   └─ styles.css
```

For V2-1A, source adapter files may contain placeholders or mock data only.

---

## 7. index.html Requirement

`index.html` is required for GitHub Pages, but it must be thin.

It should only:

```txt
- define the root app container
- load global CSS
- load theme CSS
- load src/app/main.js as an ES module
```

Example direction:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Market Intelligence Dashboard</title>
    <link rel="stylesheet" href="./src/styles.css" />
    <link rel="stylesheet" href="./src/themes/elf-theme.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/app/main.js"></script>
  </body>
</html>
```

Do not put market logic, analytics, API logic, or large HTML templates inside `index.html`.

---

## 8. Generic Core vs Elf Source Adapter

### Generic core

Files under `src/core/` must not depend on Elf-specific concepts.

Generic core should use terms like:

```txt
asset
actor
transaction
value
currency
market signal
market model
```

Avoid Elf-only terms in core such as:

```txt
Elf
Sigil-specific logic
orderType mapping
Elf item IDs
Elf API endpoint
```

### Elf source adapter

Files under `src/sources/elf/` may contain Elf-specific details:

```txt
Elf API proxy endpoint
Elf item IDs
Elf item names
Sigil conversion
orderType seller/buyer mapping
Elf-specific raw response handling
```

Elf-specific data must be converted into a generic market transaction before entering `src/core/`.

---

## 9. Generic Transaction Direction

Use a structured generic market transaction as the preferred direction.

Do not freeze the exact object shape too rigidly, but the normalized transaction must preserve these concepts:

```txt
transaction id
transaction time
source metadata
asset identity
quantity
total value
unit value
currency
raw value if useful
seller actor
buyer actor
original source participants if useful
raw transaction reference for debugging
```

Preferred shape:

```js
{
  id: "",
  time: 0,

  source: {
    name: "elf",
    itemId: "",
    fetchedAt: 0
  },

  asset: {
    id: "",
    name: "",
    group: "",
    category: ""
  },

  quantity: 0,

  value: {
    total: 0,
    unit: 0,
    currency: "SIGIL",
    raw: 0
  },

  actors: {
    seller: {
      id: "",
      name: ""
    },
    buyer: {
      id: "",
      name: ""
    }
  },

  raw: {}
}
```

If helpful, include a temporary legacy compatibility object for old flat fields:

```js
legacy: {
  itemId,
  itemName,
  itemGroup,
  category,
  itemNum,
  price,
  orderType,
  totalAmountSigil,
  txnId,
  txnTime,
  orderUserId,
  orderUserName,
  traderId,
  traderName,
  sellerId,
  sellerName,
  buyerId,
  buyerName
}
```

Legacy compatibility is allowed for debugging and gradual migration, but new core analytics should prefer the generic structured fields.

---

## 10. Elf Normalization Rules

Elf raw API fields may include:

```txt
itemNum
totalAmount
orderType
orderUserId
orderUserName
traderId
traderName
txnId
txnTime
```

Elf-specific conversion:

```js
totalAmountSigil = Number(rawTx.totalAmount) / 1e9
unitPrice = totalAmountSigil / itemNum
```

Elf seller/buyer mapping:

```txt
orderType === 1:
  seller = orderUser
  buyer = trader

orderType === 2:
  seller = trader
  buyer = orderUser
```

This mapping belongs in:

```txt
src/sources/elf/normalize-elf-transaction.js
```

It must not be placed in generic core analytics.

---

## 11. MarketModel Requirement

`src/core/data/market-model.js` should export:

```js
buildMarketModel(transactions, context)
```

It should accept generic normalized market transactions.

V2-1 output should include:

```js
{
  meta: {
    source,
    generatedAt,
    latestTransactionTime
  },

  transactions,

  totals: {
    totalTransactions,
    totalVolume,
    activeSellers,
    activeBuyers,
    latestTransactionTime
  },

  assetStats,
  actorStats,

  signals: [],
  marketHealth: null
}
```

The exact names can be adjusted slightly if documented, but the model must remain the single primary source for views.

---

## 12. Analytics Responsibility

Generic analytics belongs in `src/core/analytics/`.

### `totals.js`

Calculates:

```txt
total transactions
total volume
active sellers
active buyers
latest transaction time
```

### `asset-stats.js`

Calculates basic asset statistics:

```txt
trade count
total volume
total quantity
average unit value
last unit value
latest transaction time
active sellers
active buyers
```

### `actor-stats.js`

Calculates basic actor statistics:

```txt
sold count
bought count
total sold value
total bought value
main traded assets
counterparty count
last seen
```

### `signals.js`

Placeholder only in V2-1.

Do not implement MPS, TTS/TTP, Alerts, Watchlist, or Market Health in V2-1.

---

## 13. View Responsibility

Views must render from MarketModel only.

Views must not:

```txt
- call APIs
- normalize raw API data
- calculate major analytics
- know Elf API details
- know REFRESH_TOKEN
- know official API endpoints
```

V2-1 dashboard should show:

```txt
source name
status
refresh button
total transactions
total volume
active sellers
active buyers
latest transaction time
recent transactions
```

Use readable, dark, mobile-friendly UI.

Do not over-design V2-1.

---

## 14. UI Direction

Preferred product feel:

```txt
dark market intelligence dashboard
card-based layout
readable before decorative
mobile friendly
calm fantasy-market style for Elf theme
```

Use:

```txt
src/styles.css       = generic layout and base components
src/themes/elf-theme.css = Elf-specific visual theme
```

Do not put all styling into `index.html`.

---

## 15. Error State Requirement

The app must show visible status messages for:

```txt
loading
updated
token refresh failed
item request failed
no transactions returned
unexpected API response format
partial data loaded
```

The app must not silently fail or show a blank page.

---

## 16. V2-1A Scope: Architecture + Mock Data Only

Start with V2-1A.

Goal:

```txt
Create the reusable architecture shell and static mock dashboard.
```

Must do:

```txt
1. Create folder structure.
2. Create thin index.html.
3. Create generic core placeholders.
4. Create Elf source adapter placeholders.
5. Create mock generic market transactions.
6. Build MarketModel from mock data.
7. Render dashboard from MarketModel.
8. Render recent transactions.
9. Add simple responsive styling.
10. Confirm GitHub Pages-compatible relative paths.
```

Must not do:

```txt
live API
full item list
MPS
TTS/TTP
Alerts
Watchlist
Market Health
Player Profile
Item Profile
Bubble Map
Network Graph
Price History
full legacy UI
```

V2-1A smoke test:

```txt
Page loads
No console ReferenceError
Mock data renders
Recent transactions render
No live API calls
Core does not contain Elf API details
Views render from model
```

---

## 17. V2-1B Scope: Elf Live Adapter

Only after V2-1A is stable.

Goal:

```txt
Connect Elf source adapter to the existing Vercel proxy.
```

Must do:

```txt
1. Implement getElfAccessToken().
2. Implement fetchElfItemTransactions(item, accessToken).
3. Implement normalizeElfTransaction(rawTx, item, context).
4. Use a small Elf item list first.
5. Convert raw Elf data into generic market transactions.
6. Build MarketModel from live data.
7. Render dashboard from live MarketModel.
8. Keep all Elf-specific logic inside src/sources/elf/.
```

Use only:

```txt
POST https://elf-market-api.vercel.app/api/refresh
GET  https://elf-market-api.vercel.app/api/price?itemId={itemId}&accessToken={token}
```

V2-1B smoke test:

```txt
Page loads
Refresh button works
POST /api/refresh is called
GET /api/price is called for small item list
Live data renders or clear error renders
No console ReferenceError
No hardcoded token
Core remains generic
Views still render from MarketModel
```

---

## 18. Future Phase Plan

### V2-2: Market coverage

```txt
full Elf item list
asset categories
category tabs
better partial data handling
refresh state
```

### V2-3: Basic analytics

```txt
top sellers
top buyers
trending assets
asset stats
actor stats
market activity summary
```

### V2-4: Detail pages and search

```txt
asset detail
actor detail
search
filter
sort
URL routing
```

### V2-5: Market signals

```txt
MPS
TTS/TTP
Market Alerts
Watchlist
Market Health
High Concentration
Low-price Transfer
Repeated Quantity Signal
Trading Density Signal
```

### V2-6: Historical data

```txt
cloud database
scheduled collector
permanent price snapshots
7d / 30d trends
cross-device history
exports
```

---

## 19. Future Analytics Plugin Rule

Future MPS, TTS/TTP, Alerts, Watchlist, and Market Health should be added as independent modules.

Suggested future files:

```txt
src/core/analytics/mps.js
src/core/analytics/transfer-pattern.js
src/core/analytics/market-health.js
src/core/analytics/market-alerts.js
src/core/analytics/watchlist.js
```

The flow should remain:

```txt
analytics module calculates
MarketModel attaches result
view displays result
```

Do not calculate these directly inside dashboard, actor view, asset view, or watchlist view.

---

## 20. Neutral Wording Rules

Use neutral market-structure language only.

Do not use accusation terms:

```txt
cheater
scammer
violation
alt account
```

Use neutral terms:

```txt
Market Pattern
Watchlist
High Concentration
Structured Trading Pattern
Related Accounts
Market Concentration
Low-price Transfer
Transfer Pattern
Counterparty Concentration
Trading Density
```

The dashboard observes market structure. It does not judge player intent or enforce rules.

---

## 21. Codex Output Required

After each phase, report:

```txt
Modified files
Created files
What is generic core
What is Elf-specific adapter
What was intentionally not added
Smoke test result
Known limitations
Commit SHA after push
```

---

## 22. Stop Conditions

Stop and simplify if the implementation starts doing any of these:

```txt
copying the legacy site as one huge file
putting API calls in views
putting analytics in views
putting Elf API details in core
hardcoding tokens
adding MPS/TTS before V2-1 is stable
building a complex UI before data flow is proven
turning main.js into a large all-in-one file
```

---

## 23. Final Instruction

Do not overbuild the first version.

The correct first version is a clean foundation where:

```txt
index.html is a thin entry point
source adapter can provide data
transactions are normalized
MarketModel is stable
dashboard renders from MarketModel
errors are visible
core is reusable
Elf is only the first adapter
future features can be added without rewriting the whole site
```
