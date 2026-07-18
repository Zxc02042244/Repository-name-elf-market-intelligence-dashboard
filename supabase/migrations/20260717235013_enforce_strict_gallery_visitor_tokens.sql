-- Enforce strict visitor-token verification for the skin gallery RPCs.
--
-- This migration replaces function definitions only. It does not modify
-- existing rows, table structure, or the reviewed RPC privilege boundary.
-- It depends on 20260715165129_harden_public_rpc_privileges.sql.

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
declare
  v_skin_ids text[];
begin
  if p_visitor_id is null or p_visitor_token is null then
    raise exception 'visitor credentials are required' using errcode = '22023';
  end if;

  if p_visitor_id = p_visitor_token then
    raise exception 'visitor ID and token must be different' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_skin_ids, '{}'::text[])) > 3 then
    raise exception 'at most three skin IDs are allowed' using errcode = '22023';
  end if;

  -- The database receives typed RPC parameters, not the raw HTTP request. This
  -- caps the deserialized wishlist payload; a raw-body limit belongs at the API
  -- gateway if a stricter HTTP ceiling is required.
  if pg_column_size(coalesce(p_skin_ids, '{}'::text[])) > 1024 then
    raise exception 'wishlist payload is too large' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_skin_ids, '{}'::text[])) as requested(skin_id)
    where requested.skin_id is null
       or length(trim(requested.skin_id)) = 0
       or octet_length(trim(requested.skin_id)) > 64
       or not exists (
         select 1
         from public.skin_gallery_allowed_skins allowed
         where allowed.skin_id = trim(requested.skin_id)
       )
  ) then
    raise exception 'one or more skin IDs are not allowed' using errcode = '22023';
  end if;

  select coalesce(array_agg(normalized.skin_id order by normalized.skin_id), '{}'::text[])
  into v_skin_ids
  from (
    select distinct trim(requested.skin_id) as skin_id
    from unnest(coalesce(p_skin_ids, '{}'::text[])) as requested(skin_id)
  ) normalized;

  insert into public.skin_gallery_visitors as visitors (
    visitor_id,
    visitor_secret_hash,
    first_seen_at,
    last_seen_at,
    visit_count
  )
  values (
    p_visitor_id,
    sha256(convert_to(p_visitor_token::text, 'UTF8')),
    now(),
    now(),
    1
  )
  on conflict (visitor_id) do update
    set
      last_seen_at = excluded.last_seen_at,
      visit_count = least(visitors.visit_count + 1, 2147483647)
    -- A null hash is not claimable. Existing visitors can be updated only when
    -- the supplied token hashes to the value stored at first creation.
    where visitors.visitor_secret_hash = excluded.visitor_secret_hash;

  if not found then
    raise sqlstate 'PGRST'
      using
        message = pg_catalog.jsonb_build_object(
          'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
          'message', 'The visitor credential was not accepted.',
          'details', null,
          'hint', null
        )::text,
        detail = pg_catalog.jsonb_build_object(
          'status', 409,
          'headers', pg_catalog.jsonb_build_object()
        )::text;
  end if;

  delete from public.skin_gallery_wishes
  where visitor_id = p_visitor_id
    and not (skin_id = any(v_skin_ids));

  insert into public.skin_gallery_wishes (
    visitor_id,
    skin_id,
    selected_at
  )
  select
    p_visitor_id,
    normalized.skin_id,
    now()
  from unnest(v_skin_ids) as normalized(skin_id)
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

  if p_visitor_id = p_visitor_token then
    raise exception 'visitor ID and token must be different' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.skin_gallery_visitors
    where visitor_id = p_visitor_id
  ) then
    delete from public.skin_gallery_visitors
    where visitor_id = p_visitor_id
      and visitor_secret_hash = sha256(convert_to(p_visitor_token::text, 'UTF8'));

    if not found then
      raise sqlstate 'PGRST'
        using
          message = pg_catalog.jsonb_build_object(
            'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
            'message', 'The visitor credential was not accepted.',
            'details', null,
            'hint', null
          )::text,
          detail = pg_catalog.jsonb_build_object(
            'status', 409,
            'headers', pg_catalog.jsonb_build_object()
          )::text;
    end if;
  end if;

  return public.get_skin_gallery_stats();
end;
$$;
