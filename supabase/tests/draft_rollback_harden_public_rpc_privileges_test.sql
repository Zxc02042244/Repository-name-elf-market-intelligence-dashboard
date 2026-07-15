-- DRAFT ROLLBACK TEST ONLY
-- Run only in an isolated local database after explicitly applying:
--   1. supabase/migrations/20260715165129_harden_public_rpc_privileges.sql
--   2. docs/sql-drafts/rollback-harden-public-rpc-privileges.sql
-- This test is not a deployable migration and does not belong in migration
-- history.

\set ON_ERROR_STOP on

do $$
begin
  if not has_function_privilege('anon', 'public.get_skin_gallery_stats()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.get_skin_gallery_stats()', 'EXECUTE')
     or not has_function_privilege('anon', 'public.get_skin_supply_stats()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.get_skin_supply_stats()', 'EXECUTE')
     or not has_function_privilege('anon', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.sync_skin_gallery_state(uuid,uuid,text[])', 'EXECUTE')
     or not has_function_privilege('anon', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.delete_skin_gallery_state(uuid,uuid)', 'EXECUTE') then
    raise exception 'rollback did not restore the captured browser ACLs';
  end if;

  if has_function_privilege('anon', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.sync_skin_supply_snapshot(jsonb)', 'EXECUTE') then
    raise exception 'rollback did not restore the captured supply-sync ACL';
  end if;

  if not has_function_privilege('public', 'public.rls_auto_enable()', 'EXECUTE') then
    raise exception 'rollback did not restore rls_auto_enable PUBLIC EXECUTE';
  end if;

  if exists (
    select 1
    from pg_default_acl
    where defaclobjtype = 'f'
      and defaclrole = 'postgres'::regrole
      and defaclnamespace = 0
  ) then
    raise exception 'rollback did not restore postgres global function defaults';
  end if;
end;
$$;

select 'permission rollback draft tests passed' as result;
