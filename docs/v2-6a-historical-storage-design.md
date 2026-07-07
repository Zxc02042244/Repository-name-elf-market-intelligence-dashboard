# V2-6A Historical Storage Design

This document defines the proposed historical storage boundary for the Elf Market Intelligence Dashboard.
It is a design artifact only. It does not implement a collector, connect the UI to historical data, or add
market signal features.

## Design Summary

The recommended primary architecture is:

- Supabase Postgres stores historical marketplace data.
- GitHub Actions runs the first scheduled collector prototype.
- Vercel Cron remains optional if the project plan supports the required cadence.
- GitHub Pages remains a read-only frontend.
- Historical read APIs return aggregated summaries only.

The storage design keeps the current architecture boundary:

- Elf-specific API access, item ids, and source metadata stay outside the generic core.
- Raw Elf API responses are normalized before being stored or consumed.
- The frontend does not receive refresh tokens, access tokens, service role keys, raw auth payloads, or official API headers.
- The frontend reads only limited summary endpoints or RLS-protected summary views.

## Phase Split

### V2-6A Historical Storage Design

Define schema, dedupe keys, collector flow, security boundary, cadence, and read API shape.

### V2-6B Scheduled Collector Prototype

Build a server-side collector with a small item subset. It should run manually first, then on a conservative schedule.

### V2-6C Read-only Historical Summary API

Expose aggregated summaries only. Do not expose raw auth data, official API details, or unrestricted tables.

### V2-6D 7D / 30D Trend UI

Render historical summary data in the frontend after the storage and read API are stable.

## Proposed SQL Schema

The schema uses neutral market terms and keeps source-specific values in source columns and item metadata.

```sql
create table if not exists items (
  source text not null,
  item_id text not null,
  item_name text not null,
  asset_class text not null default 'Unclassified / Other',
  category text not null default 'Other',
  group_name text not null default 'Other',
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source, item_id)
);

create table if not exists collector_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger_type text not null,
  requested_items integer not null default 0,
  loaded_items integer not null default 0,
  failed_items integer not null default 0,
  inserted_transactions integer not null default 0,
  duplicate_transactions integer not null default 0,
  snapshot_count integer not null default 0,
  status text not null,
  error_summary text,
  created_at timestamptz not null default now()
);

create table if not exists market_transactions (
  source text not null,
  item_id text not null,
  transaction_id text not null,
  transaction_time timestamptz not null,
  item_name text not null,
  asset_class text not null,
  category text not null,
  group_name text not null,
  quantity numeric not null,
  total_value numeric not null,
  unit_value numeric not null,
  currency text not null,
  seller_id text not null,
  seller_name text not null,
  buyer_id text not null,
  buyer_name text not null,
  raw_hash text not null,
  collected_at timestamptz not null default now(),
  collector_run_id uuid references collector_runs(id),
  primary key (source, item_id, transaction_id)
);

create unique index if not exists market_transactions_raw_hash_key
  on market_transactions (raw_hash);

create index if not exists market_transactions_time_idx
  on market_transactions (source, transaction_time desc);

create index if not exists market_transactions_item_time_idx
  on market_transactions (source, item_id, transaction_time desc);

create index if not exists market_transactions_seller_time_idx
  on market_transactions (source, seller_id, transaction_time desc);

create index if not exists market_transactions_buyer_time_idx
  on market_transactions (source, buyer_id, transaction_time desc);

create table if not exists price_snapshots (
  source text not null,
  item_id text not null,
  bucket_start timestamptz not null,
  bucket_minutes integer not null,
  snapshot_at timestamptz not null default now(),
  item_name text not null,
  asset_class text not null,
  category text not null,
  group_name text not null,
  trade_count integer not null default 0,
  total_quantity numeric not null default 0,
  total_volume numeric not null default 0,
  average_unit_value numeric not null default 0,
  min_unit_value numeric,
  max_unit_value numeric,
  last_unit_value numeric,
  latest_transaction_time timestamptz,
  collector_run_id uuid references collector_runs(id),
  primary key (source, item_id, bucket_start, bucket_minutes)
);

create index if not exists price_snapshots_bucket_idx
  on price_snapshots (source, bucket_start desc, bucket_minutes);

create index if not exists price_snapshots_item_bucket_idx
  on price_snapshots (source, item_id, bucket_start desc, bucket_minutes);
```

Optional daily aggregate tables should be added only after the collector and price snapshots are stable.

```sql
create table if not exists asset_daily_stats (
  source text not null,
  item_id text not null,
  stat_date date not null,
  item_name text not null,
  asset_class text not null,
  category text not null,
  group_name text not null,
  trade_count integer not null default 0,
  total_quantity numeric not null default 0,
  total_volume numeric not null default 0,
  average_unit_value numeric not null default 0,
  min_unit_value numeric,
  max_unit_value numeric,
  last_unit_value numeric,
  active_sellers integer not null default 0,
  active_buyers integer not null default 0,
  primary key (source, item_id, stat_date)
);

create table if not exists actor_daily_stats (
  source text not null,
  actor_id text not null,
  stat_date date not null,
  actor_name text not null,
  sold_count integer not null default 0,
  bought_count integer not null default 0,
  total_sold_value numeric not null default 0,
  total_bought_value numeric not null default 0,
  counterparty_count integer not null default 0,
  last_seen timestamptz,
  primary key (source, actor_id, stat_date)
);
```

## Dedupe Keys

### Transaction-level key

Use a conservative primary key:

```txt
source + item_id + transaction_id
```

Use `raw_hash` as a fallback unique key. The fallback hash should be built from normalized source fields that
represent the economic event:

```txt
source
item_id
transaction_id
transaction_time
quantity
total_value
seller_id
buyer_id
currency
```

The collector should insert transactions with conflict ignore or conflict update. It should count duplicates
without treating them as collector failures.

### Snapshot-level key

Use:

```txt
source + item_id + bucket_start + bucket_minutes
```

Snapshots can be updated if the same bucket is recomputed during the same collector window.

## Proposed Env / Secrets List

Server-side only:

```txt
ELF_REFRESH_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
COLLECTOR_AUTH_SECRET
COLLECTOR_SOURCE_NAME
COLLECTOR_ITEM_LIMIT
COLLECTOR_CONCURRENCY
```

Optional read-only frontend or public API values:

```txt
PUBLIC_HISTORICAL_SUMMARY_API_URL
SUPABASE_ANON_KEY
```

`SUPABASE_ANON_KEY` is only acceptable if Row Level Security exposes limited summary views and never exposes
raw transactions, service role privileges, auth payloads, or secrets.

## Proposed Collector Flow

1. A scheduled trigger starts the collector.
2. The collector creates a `collector_runs` row with `status = 'running'`.
3. The collector performs server-side token refresh.
4. The collector fetches a controlled item subset first, then later the full item list if stable.
5. Item requests use controlled concurrency.
6. Raw source transactions are normalized into the existing generic transaction contract.
7. The collector upserts `items`.
8. The collector inserts `market_transactions` with conflict ignore or conflict update.
9. The collector generates `price_snapshots` for each loaded item.
10. The collector writes loaded, failed, inserted, duplicate, and snapshot counts back to `collector_runs`.
11. If partial data occurs, the collector records the run as `partial` instead of failing the whole run.
12. If token refresh fails, the collector records the run as `failed` and does not attempt item requests.

## Proposed Read API Shape

The GitHub Pages frontend should not read raw collector tables directly during the first historical phase.
Use read-only summary endpoints or RLS-protected summary views.

Example endpoints:

```txt
GET /api/history/summary?source=elf&range=7d
GET /api/history/assets?source=elf&range=7d&limit=50
GET /api/history/assets/{itemId}?source=elf&range=30d
GET /api/history/actors?source=elf&range=7d&limit=50
GET /api/history/collector-runs?source=elf&limit=20
```

Example summary response:

```json
{
  "source": "elf",
  "range": "7d",
  "generatedAt": "2026-07-07T00:00:00.000Z",
  "totals": {
    "transactionCount": 0,
    "totalVolume": 0,
    "activeAssets": 0,
    "activeSellers": 0,
    "activeBuyers": 0
  },
  "assetClasses": [],
  "categories": [],
  "topAssets": [],
  "collectorHealth": {
    "latestRunAt": null,
    "latestStatus": "unknown",
    "partialRuns": 0,
    "failedRuns": 0
  }
}
```

The API should not return access tokens, refresh tokens, official API endpoints, request headers, cookies,
raw auth payloads, or unrestricted raw API responses.

## Cadence Plan

Start with:

```txt
manual run first
every 6 hours for 24-48 hours
hourly or every 2 hours only after stable collector runs
```

Do not start with every 5 minutes because the project does not yet have enough evidence about upstream API
tolerance, token refresh limits, item request duration, partial failure rate, duplicate volume, and database cost.

## Security Boundary

The frontend must never contain:

- `REFRESH_TOKEN`
- hardcoded `accessToken`
- bearer token strings
- database service role key
- official Elf API request headers
- official Elf API cookies
- raw auth payloads

The GitHub Pages frontend must not call the official Elf API directly. Historical reads must go through a
public limited summary API or RLS-protected summary views.

## Risks and Limitations

- The first collector may reveal duplicate or missing transaction edge cases.
- Upstream API shape can change and break normalization.
- A large item list can create partial data runs.
- Too frequent collection can create unnecessary API pressure and database write volume.
- GitHub Actions scheduling is acceptable for a free prototype but is not a high-precision scheduler.
- RLS must be reviewed before any browser-based direct Supabase reads.
- This design does not define advanced market signals or enforcement logic.

## Intentionally Not Implemented

- Scheduled collector code
- Historical read API code
- UI connection to historical data
- 7D / 30D trend UI
- MPS
- TTS / TTP
- Alerts
- Watchlist
- Market Health
- Bubble Map
- Network Graph
- Suspicion scoring
- Low-price transfer detection
- Related-account detection
- React, Vite, npm, bundler, or build step
