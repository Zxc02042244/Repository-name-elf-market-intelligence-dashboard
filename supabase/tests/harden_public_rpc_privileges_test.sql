\set ON_ERROR_STOP on

do $$
begin
  if not has_function_privilege('anon', 'public.get_skin_gallery_stats()', 'EXECUTE')
     or not has_function_privilege('anon', 'public.get_skin_supply_stats()', 'EXECUTE')
     or not has_function_privilege('anon', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or not has_function_privilege('anon', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE') then
    raise exception 'anon ELF RPC allowlist is incomplete';
  end if;

  if has_function_privilege('authenticated', 'public.get_skin_gallery_stats()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.get_skin_supply_stats()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE') then
    raise exception 'authenticated retained an ELF RPC grant';
  end if;

  if has_function_privilege('anon', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE') then
    raise exception 'supply sync role boundary is incorrect';
  end if;

  if has_function_privilege('service_role', 'public.get_skin_gallery_stats()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.get_skin_supply_stats()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or has_function_privilege('service_role', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE') then
    raise exception 'service_role retained an RPC outside supply sync';
  end if;

  if has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') then
    raise exception 'Data API role retained rls_auto_enable EXECUTE';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where n.nspname = 'public'
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) then
    raise exception 'a public function retained implicit PUBLIC EXECUTE';
  end if;
end;
$$;

-- The permission migration must not disable the internal event-trigger path.
create table public.__ensure_rls_probe (id integer);
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.__ensure_rls_probe'::regclass) then
    raise exception 'ensure_rls stopped enabling RLS';
  end if;
end;
$$;
drop table public.__ensure_rls_probe;

-- A future function created by postgres should not inherit Data API or
-- service_role execution.
create function public.__default_acl_probe()
returns integer language sql as $$ select 1 $$;
do $$
begin
  if has_function_privilege('anon', 'public.__default_acl_probe()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.__default_acl_probe()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.__default_acl_probe()', 'EXECUTE') then
    raise exception 'postgres default function ACL remains overbroad';
  end if;
end;
$$;
drop function public.__default_acl_probe();

-- Existing legacy behavior remains unchanged in the permission-only migration:
-- a null-hash visitor can adopt its first token.
insert into public.skin_gallery_visitors (visitor_id, visitor_secret_hash)
values ('10000000-0000-4000-8000-000000000001'::uuid, null);

set role anon;
select public.get_skin_gallery_stats();
select public.get_skin_supply_stats();
select public.sync_skin_gallery_state(
  '10000000-0000-4000-8000-000000000001'::uuid,
  '20000000-0000-4000-8000-000000000001'::uuid,
  array['toy-sheriff']::text[]
);
reset role;

do $$
begin
  if (select visitor_secret_hash is null from public.skin_gallery_visitors where visitor_id = '10000000-0000-4000-8000-000000000001') then
    raise exception 'permission migration changed legacy token adoption behavior';
  end if;
end;
$$;

select 'permission-only migration tests passed' as result;
