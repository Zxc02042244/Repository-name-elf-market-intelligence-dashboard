# Supabase Schema Draft

This directory contains the draft Postgres schema for future historical market collection.
It is not applied by this repository yet and does not include any Supabase client code.

## Purpose

The schema is intended to support the future manual historical collector prototype. It defines storage for:

- collector run metadata
- market item metadata
- normalized market transactions
- item price snapshots

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

## Secrets

Do not commit secrets in this directory.

Never commit:

- Supabase project URL
- Supabase service role key
- refresh tokens
- access tokens
- bearer tokens
- source API credentials
- request headers or cookies
- raw auth payloads

Any real Supabase credentials must live only in a trusted server-side environment.

## Current Status

This is a schema draft only.

Not implemented yet:

- Supabase client
- database writes
- Row Level Security policies
- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- historical read API
- runtime UI integration
