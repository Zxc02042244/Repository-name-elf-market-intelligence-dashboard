-- Apply this once to an existing ELF Supabase project before deploying the
-- matching frontend. schema.sql already contains the same final definitions.

alter table public.collector_runs enable row level security;
alter table public.items enable row level security;
alter table public.market_transactions enable row level security;
alter table public.price_snapshots enable row level security;

revoke all on public.collector_runs from public, anon, authenticated;
revoke all on public.items from public, anon, authenticated;
revoke all on public.market_transactions from public, anon, authenticated;
revoke all on public.price_snapshots from public, anon, authenticated;

alter table public.skin_gallery_visitors
  add column if not exists visitor_secret_hash bytea;

revoke all on public.skin_gallery_visitors from public, anon, authenticated;
revoke all on public.skin_gallery_allowed_skins from public, anon, authenticated;
revoke all on public.skin_gallery_wishes from public, anon, authenticated;
revoke all on public.skin_supply_snapshots from public, anon, authenticated;

create or replace function public.get_skin_gallery_stats()
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
          jsonb_build_object('skinId', ranked.skin_id, 'wishCount', ranked.wish_count)
          order by ranked.wish_count desc, ranked.skin_id
        )
        from (
          select wishes.skin_id, count(*)::integer as wish_count
          from public.skin_gallery_wishes wishes
          inner join public.skin_gallery_allowed_skins allowed on allowed.skin_id = wishes.skin_id
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

create or replace function public.delete_skin_gallery_state(
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

revoke all on function public.get_skin_gallery_stats() from public, anon, authenticated;
revoke all on function public.sync_skin_gallery_state(uuid, uuid, text[]) from public, anon, authenticated;
revoke all on function public.delete_skin_gallery_state(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_skin_gallery_stats() to anon, authenticated;
grant execute on function public.sync_skin_gallery_state(uuid, uuid, text[]) to anon, authenticated;
grant execute on function public.delete_skin_gallery_state(uuid, uuid) to anon, authenticated;

revoke all on function public.get_skin_supply_stats() from public, anon, authenticated;
revoke all on function public.sync_skin_supply_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.get_skin_supply_stats() to anon, authenticated;
grant execute on function public.sync_skin_supply_snapshot(jsonb) to service_role;

create or replace function public.get_skin_supply_stats()
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
    select snapshots.snapshot_date, snapshots.skin_id, snapshots.skin_name,
      snapshots.supply, snapshots.observed_at
    from public.skin_supply_snapshots snapshots
    cross join current_snapshot_day
    where snapshots.snapshot_date = current_snapshot_day.snapshot_date
  ),
  previous_rows as (
    select distinct on (snapshots.skin_id)
      snapshots.skin_id, snapshots.supply as previous_supply,
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
          'todayAdded', case
            when previous_rows.previous_supply is null then null
            else greatest(today_rows.supply - previous_rows.previous_supply, 0)
          end,
          'observedAt', today_rows.observed_at
        ) order by today_rows.supply desc, today_rows.skin_id
      ) filter (where today_rows.skin_id is not null),
      '[]'::jsonb
    )
  )
  from current_snapshot_day
  left join today_rows on true
  left join previous_rows on previous_rows.skin_id = today_rows.skin_id
  group by current_snapshot_day.snapshot_date;
$$;

create or replace function public.sync_skin_supply_snapshot(
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
    snapshot_date, skin_id, skin_name, supply, observed_at
  )
  select v_snapshot_date, allowed.skin_id, normalized.skin_name,
    normalized.supply, now()
  from (
    select trim(records."skinId") as skin_id,
      trim(records."skinName") as skin_name,
      floor(records.supply)::integer as supply
    from jsonb_to_recordset(coalesce(p_skins, '[]'::jsonb)) as records(
      "skinId" text, "skinName" text, supply numeric
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
    set skin_name = excluded.skin_name,
      supply = greatest(snapshots.supply, excluded.supply),
      observed_at = excluded.observed_at;

  return public.get_skin_supply_stats();
end;
$$;
