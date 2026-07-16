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

-- Everything in the exposed public schema is private by default. Trusted
-- collectors use a server-side secret/service-role key, which bypasses RLS.
alter table collector_runs enable row level security;
alter table items enable row level security;
alter table market_transactions enable row level security;
alter table price_snapshots enable row level security;

revoke all on collector_runs from public, anon, authenticated;
revoke all on items from public, anon, authenticated;
revoke all on market_transactions from public, anon, authenticated;
revoke all on price_snapshots from public, anon, authenticated;

-- ELF skin gallery community stats.
-- Public clients use only sync_skin_gallery_state(); they do not write tables directly.
-- visitor_id is an anonymous browser UUID generated by the frontend and stored in localStorage.

create table if not exists skin_gallery_visitors (
  visitor_id uuid primary key,
  visitor_secret_hash bytea,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 1,
  constraint skin_gallery_visitors_visit_count_check
    check (visit_count > 0)
);

-- Accepted production difference: existing projects received
-- visitor_secret_hash through this ALTER, so it is physically the last column
-- there, while a database created from this reference declares it second.
-- Column-name-based behavior is equivalent; do not rebuild production solely
-- to reorder this column.
alter table skin_gallery_visitors
  add column if not exists visitor_secret_hash bytea;

create table if not exists skin_gallery_allowed_skins (
  skin_id text primary key,
  skin_name text not null,
  updated_at timestamptz not null default now(),
  constraint skin_gallery_allowed_skins_skin_id_check
    check (skin_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into skin_gallery_allowed_skins (
  skin_id,
  skin_name,
  updated_at
)
values
  ('genesis-pioneer', 'Genesis Pioneer', now()),
  ('pioneer-spark', 'Pioneer Spark', now()),
  ('pioneer-swift', 'Pioneer Swift', now()),
  ('take-my-pi', 'Take My Pi', now()),
  ('cidi-echo', 'CiDi Echo', now()),
  ('arale', 'Arale', now()),
  ('pink-bunny', 'Pink Bunny', now()),
  ('trailblazer', 'Trailblazer', now()),
  ('shark-hoodie', 'Shark Hoodie', now()),
  ('arcane-prince', 'Arcane Prince', now()),
  ('spinning-kicker', 'Spinning Kicker', now()),
  ('dune-walker', 'Dune Walker', now()),
  ('cosmic-sovereign', 'Cosmic Sovereign', now()),
  ('galactic-cadet', 'Galactic Cadet', now()),
  ('toy-sheriff', 'Toy Sheriff', now()),
  ('lion-dance', 'Lion Dance', now()),
  ('amber-miner', 'Amber Miner', now()),
  ('tomato-darling', 'Tomato Darling', now()),
  ('chick-starlet', 'Chick Starlet', now()),
  ('cloudtop-chef', 'Cloudtop Chef', now()),
  ('hornwood-spirit', 'Hornwood Spirit', now()),
  ('moo-moo', 'Moo Moo', now()),
  ('prairie-wanderer', 'Prairie Wanderer', now()),
  ('pumpkin-whisper', 'Pumpkin Whisper', now()),
  ('treasure-hunter', 'Treasure Hunter', now()),
  ('workshop-artisan', 'Workshop Artisan', now()),
  ('octo-pirate', 'Octo Pirate', now()),
  ('steel-enforcer', 'Steel Enforcer', now()),
  ('starborn-warrior', 'Starborn Warrior', now()),
  ('heroic-guardian', 'Heroic Guardian', now()),
  ('mantis-fighter', 'Mantis Fighter', now()),
  ('alien-hunter', 'Alien Hunter', now()),
  ('stardeep-warden', 'Stardeep Warden', now()),
  ('arena-gladiator', 'Arena Gladiator', now()),
  ('claw-ranger', 'Claw Ranger', now()),
  ('wolf-hood', 'Wolf Hood', now()),
  ('desert-lizard', 'Desert Lizard', now()),
  ('shield-commander', 'Shield Commander', now()),
  ('emerald-sage', 'Emerald Sage', now()),
  ('frost-enchantress', 'Frost Enchantress', now()),
  ('flame-brawler', 'Flame Brawler', now()),
  ('bio-warrior', 'Bio Warrior', now()),
  ('frost-envoy', 'Frost Envoy', now()),
  ('flame-runner', 'Flame Runner', now()),
  ('zombie-walker', 'Zombie Walker', now()),
  ('bubble-beast', 'Bubble Beast', now()),
  ('pumpkin-head', 'Pumpkin Head', now()),
  ('dark-ooze', 'Dark Ooze', now()),
  ('tree-guardian', 'Tree Guardian', now()),
  ('apple-darling', 'Apple Darling fallback alias', now()),
  ('tigerstripe', 'Tigerstripe fallback alias', now())
on conflict (skin_id) do update
  set
    skin_name = excluded.skin_name,
    updated_at = excluded.updated_at;

create table if not exists skin_gallery_wishes (
  visitor_id uuid not null references skin_gallery_visitors(visitor_id) on delete cascade,
  skin_id text not null,
  selected_at timestamptz not null default now(),
  primary key (visitor_id, skin_id),
  constraint skin_gallery_wishes_skin_id_check
    check (length(trim(skin_id)) > 0)
);

create index if not exists skin_gallery_wishes_skin_id_idx
  on skin_gallery_wishes (skin_id);

alter table skin_gallery_visitors enable row level security;
alter table skin_gallery_allowed_skins enable row level security;
alter table skin_gallery_wishes enable row level security;

revoke all on skin_gallery_visitors from public, anon, authenticated;
revoke all on skin_gallery_allowed_skins from public, anon, authenticated;
revoke all on skin_gallery_wishes from public, anon, authenticated;

delete from skin_gallery_wishes wishes
where not exists (
  select 1
  from skin_gallery_allowed_skins allowed
  where allowed.skin_id = wishes.skin_id
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skin_gallery_wishes_allowed_skin_fk'
  ) then
    alter table skin_gallery_wishes
      add constraint skin_gallery_wishes_allowed_skin_fk
      foreign key (skin_id) references skin_gallery_allowed_skins(skin_id);
  end if;
end;
$$;

create or replace function get_skin_gallery_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'visitorCount', (select count(*)::integer from public.skin_gallery_visitors),
    'wishlistLeaders', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'skinId', ranked.skin_id,
            'wishCount', ranked.wish_count
          )
          order by ranked.wish_count desc, ranked.skin_id
        )
        from (
          select
            wishes.skin_id,
            count(*)::integer as wish_count
          from public.skin_gallery_wishes wishes
          inner join public.skin_gallery_allowed_skins allowed
            on allowed.skin_id = wishes.skin_id
          group by wishes.skin_id
          order by count(*) desc, wishes.skin_id
          limit 10
        ) ranked
      ),
      '[]'::jsonb
    )
  );
$$;

drop function if exists public.sync_skin_gallery_state(uuid, text[]);

create or replace function public.sync_skin_gallery_state(
  p_visitor_id uuid,
  p_visitor_token uuid,
  p_skin_ids text[] default '{}'::text[]
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_visitor_id is null or p_visitor_token is null then
    raise exception 'visitor credentials are required' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_skin_ids, '{}'::text[])) > 3 then
    raise exception 'at most three skin IDs are allowed' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_skin_ids, '{}'::text[])) as requested(skin_id)
    where length(trim(requested.skin_id)) = 0
       or not exists (
         select 1 from public.skin_gallery_allowed_skins allowed
         where allowed.skin_id = trim(requested.skin_id)
       )
  ) then
    raise exception 'one or more skin IDs are not allowed' using errcode = '22023';
  end if;

  insert into public.skin_gallery_visitors as visitors (
    visitor_id, visitor_secret_hash, first_seen_at, last_seen_at, visit_count
  )
  values (
    p_visitor_id, sha256(convert_to(p_visitor_token::text, 'UTF8')), now(), now(), 1
  )
  on conflict (visitor_id) do update
    set last_seen_at = excluded.last_seen_at,
        visit_count = least(visitors.visit_count + 1, 2147483647),
        visitor_secret_hash = excluded.visitor_secret_hash
    where visitors.visitor_secret_hash is null
       or visitors.visitor_secret_hash = excluded.visitor_secret_hash;

  if not found then
    raise exception 'visitor credentials do not match' using errcode = '42501';
  end if;

  delete from public.skin_gallery_wishes
  where visitor_id = p_visitor_id
    and skin_id not in (
      select distinct trim(skin_id)
      from unnest(coalesce(p_skin_ids, '{}'::text[])) as skin_id
    );

  insert into public.skin_gallery_wishes (visitor_id, skin_id, selected_at)
  select p_visitor_id, trim(skin_id), now()
  from unnest(coalesce(p_skin_ids, '{}'::text[])) as skin_id
  group by trim(skin_id)
  on conflict (visitor_id, skin_id) do nothing;

  return public.get_skin_gallery_stats();
end;
$$;

create or replace function delete_skin_gallery_state(
  p_visitor_id uuid,
  p_visitor_token uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_visitor_id is null or p_visitor_token is null then
    raise exception 'visitor credentials are required' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.skin_gallery_visitors where visitor_id = p_visitor_id
  ) then
    delete from public.skin_gallery_visitors
    where visitor_id = p_visitor_id
      and visitor_secret_hash = sha256(convert_to(p_visitor_token::text, 'UTF8'));

    if not found then
      raise exception 'visitor credentials do not match' using errcode = '42501';
    end if;
  end if;

  return public.get_skin_gallery_stats();
end;
$$;

revoke all on function get_skin_gallery_stats() from public, anon, authenticated;
revoke all on function sync_skin_gallery_state(uuid, uuid, text[]) from public, anon, authenticated;
revoke all on function delete_skin_gallery_state(uuid, uuid) from public, anon, authenticated;
grant execute on function get_skin_gallery_stats() to anon, authenticated;
grant execute on function sync_skin_gallery_state(uuid, uuid, text[]) to anon, authenticated;
grant execute on function delete_skin_gallery_state(uuid, uuid) to anon, authenticated;

-- ELF skin daily supply snapshots.
-- Public clients read with get_skin_supply_stats(); the scheduled worker writes through sync_skin_supply_snapshot().
-- The snapshot stores one row per skin per Taipei date, then compares it with
-- the latest earlier snapshot to calculate today's added supply.

create table if not exists skin_supply_snapshots (
  snapshot_date date not null default ((now() at time zone 'Asia/Taipei')::date),
  skin_id text not null references skin_gallery_allowed_skins(skin_id),
  skin_name text not null,
  supply integer not null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (snapshot_date, skin_id),
  constraint skin_supply_snapshots_supply_check
    check (supply >= 0)
);

create index if not exists skin_supply_snapshots_skin_date_idx
  on skin_supply_snapshots (skin_id, snapshot_date desc);

alter table skin_supply_snapshots enable row level security;

revoke all on skin_supply_snapshots from public, anon, authenticated;

create or replace function get_skin_supply_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with current_snapshot_day as (
    select (now() at time zone 'Asia/Taipei')::date as snapshot_date
  ),
  today_rows as (
    select
      snapshots.snapshot_date,
      snapshots.skin_id,
      snapshots.skin_name,
      snapshots.supply,
      snapshots.observed_at
    from public.skin_supply_snapshots snapshots
    cross join current_snapshot_day
    where snapshots.snapshot_date = current_snapshot_day.snapshot_date
  ),
  previous_rows as (
    select distinct on (snapshots.skin_id)
      snapshots.skin_id,
      snapshots.supply as previous_supply,
      snapshots.snapshot_date as previous_snapshot_date
    from public.skin_supply_snapshots snapshots
    cross join current_snapshot_day
    where snapshots.snapshot_date < current_snapshot_day.snapshot_date
    order by snapshots.skin_id, snapshots.snapshot_date desc
  )
  select jsonb_build_object(
    'snapshotDate', current_snapshot_day.snapshot_date::text,
    'skinTrends', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'skinId', today_rows.skin_id,
          'skinName', today_rows.skin_name,
          'snapshotDate', today_rows.snapshot_date::text,
          'supply', today_rows.supply,
          'previousSupply', previous_rows.previous_supply,
          'todayAdded',
            case
              when previous_rows.previous_supply is null then null
              else greatest(today_rows.supply - previous_rows.previous_supply, 0)
            end,
          'observedAt', today_rows.observed_at
        )
        order by today_rows.supply desc, today_rows.skin_id
      ) filter (where today_rows.skin_id is not null),
      '[]'::jsonb
    )
  )
  from current_snapshot_day
  left join today_rows
    on true
  left join previous_rows
    on previous_rows.skin_id = today_rows.skin_id
  group by current_snapshot_day.snapshot_date;
$$;

create or replace function sync_skin_supply_snapshot(
  p_skins jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_snapshot_date date := (now() at time zone 'Asia/Taipei')::date;
begin
  insert into public.skin_supply_snapshots as snapshots (
    snapshot_date,
    skin_id,
    skin_name,
    supply,
    observed_at
  )
  select
    v_snapshot_date,
    allowed.skin_id,
    normalized.skin_name,
    normalized.supply,
    now()
  from (
    select
      trim(records."skinId") as skin_id,
      trim(records."skinName") as skin_name,
      floor(records.supply)::integer as supply
    from jsonb_to_recordset(coalesce(p_skins, '[]'::jsonb)) as records(
      "skinId" text,
      "skinName" text,
      supply numeric
    )
    where length(trim(records."skinId")) > 0
      and length(trim(records."skinName")) > 0
      and records.supply is not null
      and records.supply >= 0
    order by trim(records."skinId")
    limit 100
  ) normalized
  inner join public.skin_gallery_allowed_skins allowed
    on allowed.skin_id = normalized.skin_id
  on conflict (snapshot_date, skin_id) do update
    set
      skin_name = excluded.skin_name,
      supply = greatest(snapshots.supply, excluded.supply),
      observed_at = excluded.observed_at;

  return public.get_skin_supply_stats();
end;
$$;

revoke all on function get_skin_supply_stats() from public, anon, authenticated;
revoke all on function sync_skin_supply_snapshot(jsonb) from public, anon, authenticated;
grant execute on function get_skin_supply_stats() to anon, authenticated;
grant execute on function sync_skin_supply_snapshot(jsonb) to service_role;
