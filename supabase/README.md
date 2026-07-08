# Supabase Schema Draft

This directory contains the draft Postgres schema for future historical market collection and the optional
ELF skin gallery community stats tables/functions.

## Purpose

The schema is intended to support the future manual historical collector prototype. It defines storage for:

- collector run metadata
- market item metadata
- normalized market transactions
- item price snapshots
- anonymous ELF skin gallery visitors
- official ELF skin allowlist
- anonymous ELF skin wishlist selections

The design is generic enough for reusable market sources. Elf remains the first source and should be identified
through the `source` column, not through source-specific table names.

## Relationship To The Manual Collector

The current manual collector skeleton is dry-run only and does not write to this schema.
A future implementation phase may map collector candidates into:

- `collector_runs`
- `items`
- `market_transactions`
- `price_snapshots`

The next implementation step should be a Supabase client preflight or local dry-run mapping step. It should
not enable scheduled collection yet.

## ELF Skin Gallery Community Stats

The static frontend can record cross-device skin gallery stats through Supabase REST RPC when configured.

Apply `schema.sql` in the Supabase SQL editor, then set these public values in `index.html`:

```html
<meta name="elf-community-supabase-url" content="https://YOUR_PROJECT.supabase.co" />
<meta name="elf-community-supabase-publishable-key" content="YOUR_PUBLIC_PUBLISHABLE_KEY" />
```

The frontend calls only:

```txt
POST /rest/v1/rpc/sync_skin_gallery_state
```

That RPC records one anonymous `visitor_id` per browser localStorage and stores up to three selected skin IDs.
Only skin IDs in `skin_gallery_allowed_skins` are accepted. Re-running `schema.sql` refreshes the current official
skin allowlist and removes wishlist rows that are no longer allowed before adding the foreign key constraint.
It returns:

```json
{
  "visitorCount": 10,
  "wishlistLeaders": [
    { "skinId": "skin-id", "wishCount": 3 }
  ]
}
```

This counts browsers, not real legal identities. A different PC or phone usually counts once. A different browser,
private browsing session, or cleared localStorage can count again. The design avoids IP collection and browser
fingerprinting.

## Secrets

Do not commit secrets in this directory.

Never commit:

- Supabase service role key
- refresh tokens
- access tokens
- bearer tokens
- source API credentials
- request headers or cookies
- raw auth payloads

The Supabase project URL and publishable key are public by design and may be used by the static frontend only with
the limited RPC/RLS setup from `schema.sql`. The Supabase secret key / service role key must live only in a trusted
server-side environment.

## Current Status

This is a schema draft only.

Not implemented yet:

- historical database writes
- Row Level Security policies
- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- historical read API
- historical runtime UI integration
