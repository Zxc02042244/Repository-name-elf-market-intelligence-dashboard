# V2-6B Historical DB Pause Handoff

This document records the current pause point for historical database work. It is documentation only and
does not add database writes, scheduling, frontend UI integration, or secrets.

## 1. Current Completed Status

- V2-6A Historical Storage Design is complete.
- V2-6B.0 Historical Implementation Readiness Audit is complete.
- V2-6B.1 Manual Collector Prototype Design is complete.
- V2-6B.2 Manual Collector Skeleton is complete.
- V2-6B.3 Supabase Schema Draft is complete.
- V2-6B.4 Supabase Client Preflight is complete.
- The Supabase project has been created manually outside this repository.

## 2. Supabase Schema Applied Confirmation

The schema from `supabase/schema.sql` has been manually executed in the Supabase SQL Editor.

This repository does not store the Supabase project URL, service role key, database password, screenshots,
or any raw credentials.

## 3. Verified Tables

The following tables have been verified to exist in Supabase:

- `collector_runs`
- `items`
- `market_transactions`
- `price_snapshots`

## 4. Current Safety Boundary

- No `SUPABASE_SERVICE_ROLE_KEY` has been connected to the collector yet.
- No Supabase write test has been run yet.
- No scheduled collector exists.
- No GitHub Actions workflow exists.
- No Vercel Cron exists.
- No frontend historical UI exists.
- GitHub Pages frontend remains read-only and unchanged.
- Frontend runtime must not contain `REFRESH_TOKEN`, `accessToken`, Supabase service role keys, database
  passwords, or raw credentials.
- Server-side secrets must stay outside source control.

## 5. What Has Not Been Done

- No database write test.
- No one-item collector write.
- No Supabase client write path.
- No `.env` file.
- No committed credentials.
- No scheduled collection.
- No historical read API.
- No historical frontend UI.
- No full item collection.
- No legacy snapshot code migration.

## 6. Exact Safe Resume Point

Resume at V2-6B.5 with a one-item manual database write test only.

The next implementation should use the existing manual collector skeleton and Supabase preflight module, then
add the smallest possible write path for:

- one `collector_runs` row
- one `items` upsert
- one or more `market_transactions` inserts with dedupe behavior
- one `price_snapshots` row

The collector must remain manual-only until the write path, dedupe behavior, rollback handling, and safe logs
are verified.

## 7. Future V2-6B.5 Instructions

For V2-6B.5:

- Set `SUPABASE_URL` only in local or Codex secret environment.
- Set `SUPABASE_SERVICE_ROLE_KEY` only in local or Codex secret environment.
- Do not paste secrets into prompts.
- Do not commit `.env`.
- Do not log secret values.
- Do not expose Supabase credentials to frontend source.
- Run one-item write test only.
- Keep `COLLECTOR_DRY_RUN` behavior explicit before enabling any write path.
- Verify inserted rows in Supabase manually after the run.
- Confirm `databaseWrites` count is accurate in collector output.

## 8. Non-goals Until Explicit Approval

- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No frontend historical UI.
- No historical read API.
- No full item collection.
- No MPS.
- No TTS / TTP.
- No Alerts.
- No Watchlist.
- No Market Health.
- No Bubble Map.
- No Network Graph.
- No suspicion scoring.
- No low-price or related-account detection.

## 9. Security Reminder

Do not add any of the following to this repository:

- Supabase URL value
- service role key
- secret key
- database password
- refresh token
- access token
- bearer token
- screenshots containing credentials
- raw credentials
