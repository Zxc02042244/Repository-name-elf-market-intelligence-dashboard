-- V2-6B.3 Supabase/Postgres schema draft for historical market collection.
-- This file is a draft only and is not applied by this repository.
-- Do not add secrets, project URLs, service role keys, or source API credentials here.

create extension if not exists pgcrypto;

create table if not exists collector_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null,
  item_count integer not null default 0,
  transaction_candidate_count integer not null default 0,
  snapshot_candidate_count integer not null default 0,
  inserted_transaction_count integer not null default 0,
  inserted_snapshot_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  constraint collector_runs_status_check
    check (status in ('running', 'succeeded', 'partial', 'failed'))
);

create index if not exists collector_runs_source_started_at_idx
  on collector_runs (source, started_at desc);

create table if not exists items (
  source text not null,
  item_id text not null,
  name text not null,
  group_name text not null,
  category text not null,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (source, item_id)
);

create index if not exists items_source_category_idx
  on items (source, category);

create table if not exists market_transactions (
  source text not null,
  item_id text not null,
  transaction_id text not null,
  transaction_time timestamptz not null,
  quantity numeric not null,
  total_value numeric not null,
  unit_value numeric not null,
  currency text not null,
  seller_id text not null,
  seller_name text not null,
  buyer_id text not null,
  buyer_name text not null,
  raw_hash text not null,
  raw jsonb not null default '{}'::jsonb,
  collector_run_id uuid references collector_runs(id),
  created_at timestamptz not null default now(),
  primary key (source, item_id, transaction_id),
  constraint market_transactions_item_fk
    foreign key (source, item_id) references items(source, item_id),
  constraint market_transactions_quantity_check
    check (quantity > 0),
  constraint market_transactions_total_value_check
    check (total_value >= 0),
  constraint market_transactions_unit_value_check
    check (unit_value >= 0)
);

create unique index if not exists market_transactions_raw_hash_key
  on market_transactions (raw_hash);

create index if not exists market_transactions_source_time_idx
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
  snapshot_time timestamptz not null,
  trade_count integer not null default 0,
  total_quantity numeric not null default 0,
  total_value numeric not null default 0,
  min_unit_value numeric,
  max_unit_value numeric,
  avg_unit_value numeric not null default 0,
  last_unit_value numeric,
  currency text not null,
  collector_run_id uuid references collector_runs(id),
  created_at timestamptz not null default now(),
  primary key (source, item_id, snapshot_time),
  constraint price_snapshots_item_fk
    foreign key (source, item_id) references items(source, item_id),
  constraint price_snapshots_trade_count_check
    check (trade_count >= 0),
  constraint price_snapshots_total_quantity_check
    check (total_quantity >= 0),
  constraint price_snapshots_total_value_check
    check (total_value >= 0),
  constraint price_snapshots_avg_unit_value_check
    check (avg_unit_value >= 0)
);

create index if not exists price_snapshots_source_time_idx
  on price_snapshots (source, snapshot_time desc);

create index if not exists price_snapshots_item_time_idx
  on price_snapshots (source, item_id, snapshot_time desc);
