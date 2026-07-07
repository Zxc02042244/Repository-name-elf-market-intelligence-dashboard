# V2-6B.1 Manual Collector Prototype Design

This document defines a manual-only server-side collector prototype for future implementation.
It does not implement a collector, database integration, scheduled workflow, cron job, historical read API,
or runtime UI changes.

## 1. Prototype Goal

The goal is to validate the historical storage path with the smallest safe server-side collector:

- Fetch a small Elf item subset manually.
- Normalize raw marketplace transactions into the existing generic transaction contract.
- Write historical rows to Supabase Postgres.
- Record collector run status.
- Generate item-level price snapshots.
- Keep GitHub Pages frontend unchanged.

The prototype should prove database writes, dedupe behavior, failure handling, and collector observability
before any scheduled job or historical UI is added.

## 2. Manual-only Execution Boundary

The first collector must be run manually by a developer or maintainer from a trusted server-side environment.

Allowed:

- Local manual command with environment variables loaded outside source control.
- One-off manual run in a controlled server-side shell.
- Small item subset only.

Not allowed:

- GitHub Actions schedule.
- Vercel Cron.
- Browser-triggered collector.
- GitHub Pages frontend collector trigger.
- Runtime UI connection to historical reads.
- Any collector secret in frontend files.

## 3. Required Environment Variables

Server-side only:

```txt
ELF_REFRESH_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
COLLECTOR_SOURCE_NAME
COLLECTOR_ITEM_LIMIT
COLLECTOR_CONCURRENCY
```

Optional server-side safety variables:

```txt
COLLECTOR_DRY_RUN
COLLECTOR_RUN_LABEL
COLLECTOR_REQUEST_DELAY_MS
COLLECTOR_MAX_FAILURES
```

No `.env` file should be committed. If an example is added later, it must use placeholder names only.

## 4. Secret Handling Rules

- `ELF_REFRESH_TOKEN` must live only in server-side secrets or a local untracked environment.
- `SUPABASE_SERVICE_ROLE_KEY` must live only in server-side secrets or a local untracked environment.
- `accessToken` must be runtime memory only and must not be written to source files, logs, database rows, or UI.
- Do not print authorization payloads.
- Do not print request headers.
- Do not print cookies.
- Do not print raw token refresh responses.
- Do not expose database service role credentials to GitHub Pages.
- Do not add official Elf/Cidi API calls to the frontend.

## 5. Small Item Subset Strategy

The prototype should start with a very small known-good subset:

- 1 to 3 items for the first manual dry run.
- 3 to 5 items for the first database write test.
- No full 110-item run until write, dedupe, failure, and rollback behavior are understood.

The subset should be defined in the collector implementation layer, not in generic core. It may reuse safe
item metadata from the active Elf source adapter, but implementation must avoid importing browser-only code.

The first subset should include:

- A known active item with recent transactions.
- A second item from a different category only after the first item succeeds.
- No broad category expansion in the prototype.

## 6. Collector Data Flow

Future implementation should use this flow:

```txt
manual command
-> validate server-side environment variables
-> create collector_runs row with status "running"
-> refresh token in server-side runtime
-> fetch small item subset with controlled concurrency
-> normalize raw transactions to generic transaction contract
-> upsert items
-> insert market_transactions with dedupe handling
-> generate price_snapshots
-> update collector_runs with counts and final status
```

The collector should normalize before writing to storage. Raw source data should not be exposed to frontend
runtime and should not be written wholesale unless a later explicit storage policy allows it.

## 7. Supabase Write Strategy

The prototype should write to these V2-6A tables:

- `collector_runs`
- `items`
- `market_transactions`
- `price_snapshots`

Recommended write order:

1. Insert `collector_runs` with `status = 'running'`.
2. Upsert `items` for the requested subset.
3. Insert `market_transactions` with conflict handling.
4. Insert or update `price_snapshots`.
5. Update `collector_runs` with final status and counts.

The collector should keep a clear distinction between:

- requested item count
- loaded item count
- failed item count
- inserted transaction count
- duplicate transaction count
- snapshot count

## 8. Dedupe Strategy

Transaction-level primary key:

```txt
source + item_id + transaction_id
```

Fallback unique key:

```txt
raw_hash
```

The fallback `raw_hash` should be deterministic and based on normalized economic event fields:

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

Snapshot-level key:

```txt
source + item_id + bucket_start + bucket_minutes
```

Duplicate transactions should be counted and reported, not treated as fatal collector failures.

## 9. Collector Run Logging

The collector should record:

- run id
- source
- trigger type, initially `manual`
- started time
- finished time
- requested items
- loaded items
- failed items
- inserted transactions
- duplicate transactions
- snapshot count
- status
- safe error summary

Safe status values:

```txt
running
succeeded
partial
failed
```

Error summaries must not include tokens, request headers, cookies, raw auth payloads, or full raw API responses.

## 10. Failure Handling

Token refresh failure:

- Mark collector run as `failed`.
- Do not attempt item requests.
- Do not expose token response body.

Item request failure:

- Continue other items unless failure count exceeds `COLLECTOR_MAX_FAILURES`.
- Mark run as `partial` if at least one item succeeds.
- Mark run as `failed` if no item succeeds.

Unexpected API response format:

- Treat the affected item as failed.
- Store a safe error category only.
- Do not store raw response body in logs or UI.

Database write failure:

- Mark run as `failed` if possible.
- Print a safe error category.
- Do not retry blindly in a tight loop.

No transactions returned:

- Mark item as loaded with zero transactions if the response shape is valid.
- Generate zero-count snapshot only if this behavior is explicitly approved during implementation.

## 11. Future Implementation Files

Recommended future files:

```txt
scripts/collect-elf-history.mjs
scripts/lib/supabase-client.mjs
scripts/lib/collector-config.mjs
scripts/lib/collector-hash.mjs
scripts/lib/collector-logger.mjs
scripts/lib/elf-history-normalizer.mjs
```

Optional future files after the manual prototype is stable:

```txt
supabase/schema.sql
supabase/README.md
docs/v2-6b-manual-collector-runbook.md
```

Do not add `.github/workflows/` until manual runs are stable and explicitly approved.

## 12. Smoke Test Plan

Manual preflight:

- Confirm required environment variables are present.
- Confirm no secrets are printed.
- Confirm item subset is small.
- Confirm dry run can build normalized transactions without database writes.

Database smoke:

- Run one item against Supabase.
- Confirm one `collector_runs` row is created.
- Confirm `items` is upserted.
- Confirm `market_transactions` inserts or dedupes.
- Confirm `price_snapshots` is written.
- Run the same item again and confirm duplicate transactions are counted safely.
- Confirm token, request headers, cookies, and auth payloads are not stored.

Boundary smoke:

- Confirm `src/` frontend runtime is unchanged.
- Confirm no `.github/workflows/` was added.
- Confirm GitHub Pages dashboard still loads.
- Confirm frontend still calls only the Vercel proxy.

## 13. Non-goals

- No frontend runtime changes.
- No historical read UI.
- No read-only historical summary API.
- No GitHub Actions workflow.
- No scheduled collector.
- No Vercel Cron.
- No full item list run.
- No legacy snapshot code migration.
- No official Elf/Cidi API calls from frontend.
- No `REFRESH_TOKEN` in frontend.
- No hardcoded `accessToken` in source files.
- No MPS.
- No TTS / TTP.
- No Alerts.
- No Watchlist.
- No Market Health.
- No Bubble Map.
- No Network Graph.
- No suspicion scoring.
- No low-price or related-account detection.
