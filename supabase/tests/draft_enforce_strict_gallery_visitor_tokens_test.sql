-- DRAFT MIGRATION TEST ONLY
-- This test is not part of the deployable migration set. It loads
-- docs/sql-drafts/enforce-strict-gallery-visitor-tokens.sql only inside this
-- transaction and rolls back the function replacements and all fixtures.

\set ON_ERROR_STOP on

begin;

create temporary table strict_token_application_row_counts (
  relation_name text primary key,
  row_count bigint not null
) on commit drop;

insert into strict_token_application_row_counts (relation_name, row_count)
values
  ('skin_gallery_visitors', (select count(*) from public.skin_gallery_visitors)),
  ('skin_gallery_wishes', (select count(*) from public.skin_gallery_wishes)),
  ('skin_gallery_allowed_skins', (select count(*) from public.skin_gallery_allowed_skins));

\ir ../../docs/sql-drafts/enforce-strict-gallery-visitor-tokens.sql

do $$
begin
  if (select count(*) from public.skin_gallery_visitors)
       <> (select row_count from strict_token_application_row_counts where relation_name = 'skin_gallery_visitors')
     or (select count(*) from public.skin_gallery_wishes)
       <> (select row_count from strict_token_application_row_counts where relation_name = 'skin_gallery_wishes')
     or (select count(*) from public.skin_gallery_allowed_skins)
       <> (select row_count from strict_token_application_row_counts where relation_name = 'skin_gallery_allowed_skins') then
    raise exception 'strict function replacement modified existing application row counts';
  end if;

  if not has_function_privilege('anon', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or not has_function_privilege('anon', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE') then
    raise exception 'strict function replacement changed the RPC role boundary';
  end if;

  if to_regprocedure('public.sync_skin_gallery_state(uuid,uuid,text[])') is null
     or to_regprocedure('public.delete_skin_gallery_state(uuid,uuid)') is null then
    raise exception 'strict function signature changed';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('sync_skin_gallery_state', 'delete_skin_gallery_state')
      and (
        not p.prosecdef
        or p.provolatile <> 'v'
        or p.prorettype <> 'pg_catalog.jsonb'::pg_catalog.regtype
        or pg_catalog.pg_get_userbyid(p.proowner) <> 'postgres'
        or not coalesce(p.proconfig, '{}'::text[]) @> array['search_path=""']
      )
  ) then
    raise exception 'strict function metadata changed';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('sync_skin_gallery_state', 'delete_skin_gallery_state')
  ) <> 2 then
    raise exception 'strict function inventory is unexpected';
  end if;

end;
$$;

-- Remove stale fixtures from an earlier local test run only inside this
-- transaction. The final rollback restores any pre-existing rows.
delete from public.skin_gallery_visitors
where visitor_id in (
  '30000000-0000-4000-8000-000000000001'::uuid,
  '30000000-0000-4000-8000-000000000002'::uuid,
  '30000000-0000-4000-8000-000000000010'::uuid,
  '30000000-0000-4000-8000-000000000011'::uuid
);

-- A role without EXECUTE receives PostgreSQL ACL error 42501, not the custom
-- visitor credential rejection contract.
set local role authenticated;
do $$
begin
  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000011'::uuid,
      '40000000-0000-4000-8000-000000000011'::uuid,
      array['toy-sheriff']::text[]
    );
    raise exception 'authenticated unexpectedly executed gallery sync';
  exception when sqlstate '42501' then
    null;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000011'::uuid,
      '40000000-0000-4000-8000-000000000011'::uuid
    );
    raise exception 'authenticated unexpectedly executed gallery delete';
  exception when sqlstate '42501' then
    null;
  end;
end;
$$;
reset role;

-- New visitors receive a token hash on their first insert.
set local role anon;
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

-- A valid hashed visitor accepts its correct token.
set local role anon;
select public.sync_skin_gallery_state(
  '30000000-0000-4000-8000-000000000001'::uuid,
  '40000000-0000-4000-8000-000000000001'::uuid,
  array['arale']::text[]
);
reset role;

do $$
begin
  if (select count(*) from public.skin_gallery_wishes where visitor_id = '30000000-0000-4000-8000-000000000001') <> 1
     or not exists (
       select 1
       from public.skin_gallery_wishes
       where visitor_id = '30000000-0000-4000-8000-000000000001'
         and skin_id = 'arale'
     ) then
    raise exception 'correct token did not update the hashed visitor';
  end if;
end;
$$;

-- A null-hash visitor cannot be claimed, updated, or deleted. Credential
-- rejection uses the exact PostgREST custom error envelope expected by the
-- future frontend.
insert into public.skin_gallery_visitors (visitor_id, visitor_secret_hash)
values ('30000000-0000-4000-8000-000000000010'::uuid, null);

set local role anon;
do $$
declare
  v_message text;
  v_detail text;
begin
  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000010'::uuid,
      array['toy-sheriff']::text[]
    );
    raise exception 'null-hash visitor was unexpectedly updated';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics
      v_message = message_text,
      v_detail = pg_exception_detail;
    if v_message::jsonb is distinct from pg_catalog.jsonb_build_object(
         'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
         'message', 'The visitor credential was not accepted.',
         'details', null,
         'hint', null
       )
       or v_detail::jsonb is distinct from pg_catalog.jsonb_build_object('status', 409) then
      raise exception 'null-hash sync returned an unexpected custom error contract';
    end if;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000010'::uuid
    );
    raise exception 'null-hash visitor was unexpectedly deleted';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics
      v_message = message_text,
      v_detail = pg_exception_detail;
    if v_message::jsonb is distinct from pg_catalog.jsonb_build_object(
         'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
         'message', 'The visitor credential was not accepted.',
         'details', null,
         'hint', null
       )
       or v_detail::jsonb is distinct from pg_catalog.jsonb_build_object('status', 409) then
      raise exception 'null-hash delete returned an unexpected custom error contract';
    end if;
  end;
end;
$$;

-- A hashed visitor rejects the wrong token for both update and delete.
do $$
declare
  v_message text;
  v_detail text;
begin
  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000099'::uuid,
      array['arale']::text[]
    );
    raise exception 'wrong token unexpectedly updated hashed visitor';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics
      v_message = message_text,
      v_detail = pg_exception_detail;
    if v_message::jsonb is distinct from pg_catalog.jsonb_build_object(
         'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
         'message', 'The visitor credential was not accepted.',
         'details', null,
         'hint', null
       )
       or v_detail::jsonb is distinct from pg_catalog.jsonb_build_object('status', 409) then
      raise exception 'wrong-token sync returned an unexpected custom error contract';
    end if;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000099'::uuid
    );
    raise exception 'wrong token unexpectedly deleted hashed visitor';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics
      v_message = message_text,
      v_detail = pg_exception_detail;
    if v_message::jsonb is distinct from pg_catalog.jsonb_build_object(
         'code', 'ELF_VISITOR_CREDENTIAL_REJECTED',
         'message', 'The visitor credential was not accepted.',
         'details', null,
         'hint', null
       )
       or v_detail::jsonb is distinct from pg_catalog.jsonb_build_object('status', 409) then
      raise exception 'wrong-token delete returned an unexpected custom error contract';
    end if;
  end;
end;
$$;

-- Validation failures retain their existing SQLSTATE classification.
do $$
begin
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
      null,
      '40000000-0000-4000-8000-000000000002'::uuid,
      array['arale']::text[]
    );
    raise exception 'null visitor ID was accepted';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      null
    );
    raise exception 'null visitor token was accepted by delete';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '30000000-0000-4000-8000-000000000002'::uuid,
      array['arale']::text[]
    );
    raise exception 'matching visitor ID and token were accepted by sync';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.delete_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '30000000-0000-4000-8000-000000000002'::uuid
    );
    raise exception 'matching visitor ID and token were accepted by delete';
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
      array['  ']::text[]
    );
    raise exception 'blank skin ID was accepted';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.sync_skin_gallery_state(
      '30000000-0000-4000-8000-000000000002'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      array[repeat('x', 65)]::text[]
    );
    raise exception 'oversized skin ID was accepted';
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

  begin
    perform 'not-a-uuid'::uuid;
    raise exception 'malformed UUID was accepted';
  exception when sqlstate '22P02' then null;
  end;
end;
$$;

-- Deleting an unknown visitor remains a successful no-op and does not create a
-- visitor row.
reset role;
set local role anon;
select public.delete_skin_gallery_state(
  '30000000-0000-4000-8000-000000000011'::uuid,
  '40000000-0000-4000-8000-000000000011'::uuid
);
reset role;

do $$
begin
  if exists (
    select 1
    from public.skin_gallery_visitors
    where visitor_id = '30000000-0000-4000-8000-000000000011'
  ) then
    raise exception 'unknown visitor delete created a visitor row';
  end if;
end;
$$;

set local role anon;
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

rollback;
