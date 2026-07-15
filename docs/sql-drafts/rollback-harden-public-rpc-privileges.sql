-- DRAFT ONLY
-- DO NOT APPLY AUTOMATICALLY
-- A complete rollback restores PUBLIC EXECUTE on rls_auto_enable().
-- That restoration reintroduces a known security risk.
-- For a deployment incident, assess and prefer the smallest targeted repair
-- before considering this complete rollback reference.
-- Executing this rollback requires separate, explicit authorization.
-- This is not a registered Supabase migration and must not be placed in
-- supabase/migrations/.
--
-- Purpose: restore the exact effective function ACLs and postgres function
-- default privileges captured immediately before
-- 20260715165129_harden_public_rpc_privileges.sql was reviewed for deployment.
-- It does not restore or alter function bodies, tables, rows, RLS, or triggers.

begin;

-- Refuse to operate if the reviewed function inventory or owner set drifted.
do $$
declare
  actual_signatures text[];
  expected_signatures constant text[] := array[
    'delete_skin_gallery_state(uuid, uuid)',
    'get_skin_gallery_stats()',
    'get_skin_supply_stats()',
    'rls_auto_enable()',
    'sync_skin_gallery_state(uuid, uuid, text[])',
    'sync_skin_supply_snapshot(jsonb)'
  ];
begin
  select array_agg(
    format('%s(%s)', p.proname, pg_catalog.oidvectortypes(p.proargtypes))
    order by p.proname, pg_catalog.oidvectortypes(p.proargtypes)
  )
  into actual_signatures
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public';

  if actual_signatures is distinct from expected_signatures then
    raise exception 'public function inventory drifted; expected %, found %',
      expected_signatures, actual_signatures;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_catalog.pg_get_userbyid(p.proowner) <> 'postgres'
  ) then
    raise exception 'reviewed public function owner drifted from postgres';
  end if;
end;
$$;

-- Start from an explicit deny set, then recreate only the captured grants.
-- Function owners retain EXECUTE through ownership.
revoke execute on function
  public.delete_skin_gallery_state(uuid, uuid),
  public.get_skin_gallery_stats(),
  public.get_skin_supply_stats(),
  public.rls_auto_enable(),
  public.sync_skin_gallery_state(uuid, uuid, text[]),
  public.sync_skin_supply_snapshot(jsonb)
from public, anon, authenticated, service_role;

-- Pre-change browser ACLs: anon and authenticated could execute the two public
-- statistics RPCs and the anonymous wishlist sync/delete RPCs.
grant execute on function
  public.delete_skin_gallery_state(uuid, uuid),
  public.get_skin_gallery_stats(),
  public.get_skin_supply_stats(),
  public.sync_skin_gallery_state(uuid, uuid, text[])
to anon, authenticated;

-- Pre-change worker ACL: only service_role, in addition to the owner.
grant execute on function public.sync_skin_supply_snapshot(jsonb) to service_role;

-- rls_auto_enable() had PostgreSQL's default PUBLIC EXECUTE (proacl was null).
-- Restoring PUBLIC reproduces the same effective ACL without granting any
-- additional named role directly.
grant execute on function public.rls_auto_enable() to public;

-- Before the permission migration, postgres had no global pg_default_acl row
-- for functions, so the built-in default PUBLIC EXECUTE applied globally.
-- GRANT restores that hard-wired global default. The existing public-schema
-- default ACL ({postgres=X/postgres}) is intentionally left unchanged; the
-- permission migration's schema-scoped revokes were no-ops for that snapshot.
alter default privileges for role postgres
  grant execute on functions to public;

commit;
