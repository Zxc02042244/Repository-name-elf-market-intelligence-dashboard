-- Permission-only repair for the current ELF RPC boundary.
-- This migration does not replace function bodies, modify table structure, or
-- read/write application data. The browser uses only a publishable key, so its
-- PostgREST requests execute as anon; authenticated is not currently used.

begin;

-- Deployment-time drift guard. The public-schema ACL repair is safe only
-- while this exact reviewed inventory remains true. Abort before any REVOKE if
-- production has gained an unmanaged function, an owner changed, or a public
-- function became extension-owned.
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

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    join pg_catalog.pg_depend d
      on d.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass
     and d.objid = p.oid
     and d.deptype = 'e'
    where n.nspname = 'public'
  ) then
    raise exception 'an extension-owned function exists in public';
  end if;
end;
$$;

-- Remove inherited PUBLIC access and all existing Data API role grants before
-- explicitly rebuilding the reviewed allowlist below. The list is deliberately
-- explicit so this migration cannot alter Supabase platform or extension RPCs.
revoke execute on function
  public.delete_skin_gallery_state(uuid, uuid),
  public.get_skin_gallery_stats(),
  public.get_skin_supply_stats(),
  public.rls_auto_enable(),
  public.sync_skin_gallery_state(uuid, uuid, text[]),
  public.sync_skin_supply_snapshot(jsonb)
from public, anon, authenticated;

-- Reset service_role on the five ELF RPCs so each entry point has one explicit
-- caller set. Function owners retain their owner privileges.
revoke execute on function public.get_skin_gallery_stats() from service_role;
revoke execute on function public.sync_skin_gallery_state(uuid, uuid, text[]) from service_role;
revoke execute on function public.delete_skin_gallery_state(uuid, uuid) from service_role;
revoke execute on function public.get_skin_supply_stats() from service_role;
revoke execute on function public.sync_skin_supply_snapshot(jsonb) from service_role;

-- Public browser boundary: two read RPCs plus the intentionally anonymous
-- wishlist sync/delete operations. authenticated receives no grant.
grant execute on function public.get_skin_gallery_stats() to anon;
grant execute on function public.get_skin_supply_stats() to anon;
grant execute on function public.sync_skin_gallery_state(uuid, uuid, text[]) to anon;
grant execute on function public.delete_skin_gallery_state(uuid, uuid) to anon;

-- Scheduled GitHub Actions worker boundary.
grant execute on function public.sync_skin_supply_snapshot(jsonb) to service_role;

-- ensure_rls invokes this event-trigger function internally. API roles do not
-- need direct EXECUTE; keep both the function and event trigger installed.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- All current ELF public functions are owned by postgres. PostgreSQL's default
-- PUBLIC function EXECUTE is global to the owner, so it must be revoked without
-- an IN SCHEMA clause; per-schema revocation alone does not override it.
-- This changes only future postgres-owned functions, but it applies in every
-- schema. Existing functions are unchanged, other owners (including
-- supabase_admin) are unchanged, and schema-specific grants remain additive.
alter default privileges for role postgres
  revoke execute on functions from public;

-- Supabase role defaults are then narrowed specifically for future functions
-- in public. Every intended API entry point must be granted explicitly.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

-- The hosted postgres migration role is not a member of supabase_admin, so
-- altering that role's defaults here would fail and is deliberately excluded.

commit;
