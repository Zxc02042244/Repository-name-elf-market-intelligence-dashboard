-- DRAFT MIGRATION TEST ONLY
-- This test is not part of the deployable migration set. Before running it,
-- explicitly load docs/sql-drafts/enforce-strict-gallery-visitor-tokens.sql
-- into an isolated local test database.

\set ON_ERROR_STOP on

do $$
begin
  if not has_function_privilege('anon', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or not has_function_privilege('anon', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE') then
    raise exception 'strict function replacement changed the RPC role boundary';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('sync_skin_gallery_state', 'delete_skin_gallery_state')
      and not coalesce(p.proconfig, '{}'::text[]) @> array['search_path=""']
  ) then
    raise exception 'strict function lacks an empty search_path';
  end if;
end;
$$;

-- New visitors receive a token hash on their first insert.
set role anon;
select public.sync_skin_gallery_state(
  '30000000-0000-4000-8000-000000000001'::uuid,
  '40000000-0000-4000-8000-000000000001'::uuid,
  array['toy-sheriff', 'toy-sheriff']::text[]
);
reset role;

do $$
begin
  if (select visitor_secret_hash is null from public.skin_gallery_visitors where visitor_id = '30000000-0000-4000-8000-000000000001') then
    raise exception 'new visitor did not receive a token hash';
  end if;
  if (select count(*) from public.skin_gallery_wishes where visitor_id = '30000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'duplicate wishlist entries were not normalized';
  end if;
end;
$$;

-- A null-hash visitor cannot be claimed, updated, or deleted.
insert into public.skin_gallery_visitors (visitor_id, visitor_secret_hash)
values ('30000000-0000-4000-8000-000000000010'::uuid, null);

set role anon;
do $$
begin
  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000010'::uuid,
      array['toy-sheriff']::text[]
    );
    raise exception 'null-hash visitor was unexpectedly updated';
  exception when sqlstate '42501' then null;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000010'::uuid
    );
    raise exception 'null-hash visitor was unexpectedly deleted';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

-- A hashed visitor rejects the wrong token for both update and delete.
do $$
begin
  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000099'::uuid,
      array['arale']::text[]
    );
    raise exception 'wrong token unexpectedly updated hashed visitor';
  exception when sqlstate '42501' then null;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000099'::uuid
    );
    raise exception 'wrong token unexpectedly deleted hashed visitor';
  exception when sqlstate '42501' then null;
  end;

  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      array['arale', 'toy-sheriff', 'pink-bunny', 'cidi-echo']::text[]
    );
    raise exception 'wishlist length limit was bypassed';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      array['not-an-official-skin']::text[]
    );
    raise exception 'invalid skin ID was accepted';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      array[repeat('x', 2048)]::text[]
    );
    raise exception 'oversized wishlist payload was accepted';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

select public.sync_skin_gallery_state(
  '30000000-0000-4000-8000-000000000001'::uuid,
  '40000000-0000-4000-8000-000000000001'::uuid,
  array['arale']::text[]
);
select public.delete_skin_gallery_state(
  '30000000-0000-4000-8000-000000000001'::uuid,
  '40000000-0000-4000-8000-000000000001'::uuid
);
reset role;

do $$
begin
  if exists (select 1 from public.skin_gallery_visitors where visitor_id = '30000000-0000-4000-8000-000000000001') then
    raise exception 'correct token did not delete hashed visitor';
  end if;
  if not (select visitor_secret_hash is null from public.skin_gallery_visitors where visitor_id = '30000000-0000-4000-8000-000000000010') then
    raise exception 'null-hash visitor was modified';
  end if;
end;
$$;

select 'strict-token draft tests passed' as result;
