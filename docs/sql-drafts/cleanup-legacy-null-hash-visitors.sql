-- DRAFT ONLY
-- DO NOT APPLY
--
-- This is a destructive, one-way cleanup draft. It is not a registered
-- migration and must not be placed in supabase/migrations/ without a separate
-- review and explicit production authorization.
--
-- Purpose:
--   * capture non-identifying before/after aggregate evidence;
--   * delete only visitors whose visitor_secret_hash is still null while this
--     transaction holds the reviewed write locks;
--   * verify that the reviewed ON DELETE CASCADE removes exactly the wishes
--     owned by those visitors;
--   * leave every visitor that has acquired a hash untouched.
--
-- Irreversibility:
--   The application cannot restore deleted server rows. A returning browser
--   may later recreate a hashed row from its local wishlist, but that is a new
--   synchronization event, not recovery of the deleted database record.
--
-- Audit evidence:
--   The final SELECT emits one JSON object containing counts, time ranges, and
--   per-skin aggregates only. It never emits or stores visitor UUIDs or tokens.
--   The authorized operator must save that final result in the approved audit
--   record before closing the SQL session. This draft intentionally creates no
--   persistent backup or audit table containing visitor-level data.
--
-- Promotion gate:
--   A future, separately reviewed migration may change
--   v_explicit_execution_approval to true. It must not be changed in this draft.
--   Cleanup must succeed and be observed before strict-token receives a new
--   migration review.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Fail before locks, temporary objects, counts, or data changes. A future,
-- separately reviewed migration must deliberately change this constant.
do $$
declare
  v_explicit_execution_approval constant boolean := false;
begin
  if not v_explicit_execution_approval then
    raise exception
      'DRAFT ONLY / DO NOT APPLY: explicit cleanup authorization is absent';
  end if;
end;
$$;

-- Keep the transaction short and make the before/delete/after evidence a
-- consistent snapshot. The application writes visitors before wishes, so the
-- locks follow the same order to reduce deadlock risk. Reads remain available.
lock table public.skin_gallery_visitors in share row exclusive mode;
lock table public.skin_gallery_wishes in share row exclusive mode;

create temporary table legacy_null_hash_cleanup_audit_result (
  aggregate_record jsonb not null
) on commit preserve rows;

do $$
declare
  v_observed_at timestamptz := clock_timestamp();
  v_before_visitors bigint;
  v_before_null_hash_visitors bigint;
  v_before_hashed_visitors bigint;
  v_before_wishes bigint;
  v_before_null_hash_wishes bigint;
  v_before_null_hash_visitors_with_wishes bigint;
  v_before_null_hash_visitors_without_wishes bigint;
  v_before_null_hash_wish_distribution jsonb;
  v_before_null_hash_wishes_by_skin jsonb;
  v_deleted_visitors bigint;
  v_cascaded_wishes bigint;
  v_after_visitors bigint;
  v_after_null_hash_visitors bigint;
  v_after_hashed_visitors bigint;
  v_after_wishes bigint;
  v_after_orphan_wishes bigint;
  v_after_wishes_by_skin jsonb;
begin
  -- Abort before DELETE unless the exact visitor_id foreign key still has the
  -- reviewed ON DELETE CASCADE behavior.
  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    inner join pg_catalog.pg_attribute child_column
      on child_column.attrelid = constraint_record.conrelid
     and child_column.attname = 'visitor_id'
     and not child_column.attisdropped
    inner join pg_catalog.pg_attribute parent_column
      on parent_column.attrelid = constraint_record.confrelid
     and parent_column.attname = 'visitor_id'
     and not parent_column.attisdropped
    where constraint_record.contype = 'f'
      and constraint_record.conrelid = 'public.skin_gallery_wishes'::pg_catalog.regclass
      and constraint_record.confrelid = 'public.skin_gallery_visitors'::pg_catalog.regclass
      and constraint_record.confdeltype = 'c'
      and constraint_record.conkey = array[child_column.attnum]::smallint[]
      and constraint_record.confkey = array[parent_column.attnum]::smallint[]
  ) then
    raise exception
      'reviewed visitor_id ON DELETE CASCADE constraint is missing or changed';
  end if;

  select
    count(*),
    count(*) filter (where visitor_secret_hash is null),
    count(*) filter (where visitor_secret_hash is not null)
  into
    v_before_visitors,
    v_before_null_hash_visitors,
    v_before_hashed_visitors
  from public.skin_gallery_visitors;

  select count(*)
  into v_before_wishes
  from public.skin_gallery_wishes;

  select count(*)
  into v_before_null_hash_wishes
  from public.skin_gallery_wishes wishes
  inner join public.skin_gallery_visitors visitors
    on visitors.visitor_id = wishes.visitor_id
  where visitors.visitor_secret_hash is null;

  select
    coalesce(sum(visitor_count) filter (where wish_count > 0), 0),
    coalesce(sum(visitor_count) filter (where wish_count = 0), 0),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'wishCount', wish_count,
          'visitorCount', visitor_count
        )
        order by wish_count
      ),
      '[]'::jsonb
    )
  into
    v_before_null_hash_visitors_with_wishes,
    v_before_null_hash_visitors_without_wishes,
    v_before_null_hash_wish_distribution
  from (
    select
      per_visitor.wish_count,
      count(*)::bigint as visitor_count
    from (
      select
        visitors.visitor_id,
        count(wishes.skin_id)::bigint as wish_count
      from public.skin_gallery_visitors visitors
      left join public.skin_gallery_wishes wishes
        on wishes.visitor_id = visitors.visitor_id
      where visitors.visitor_secret_hash is null
      group by visitors.visitor_id
    ) per_visitor
    group by per_visitor.wish_count
  ) distribution;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'skinId', skin_id,
        'wishCount', wish_count
      )
      order by wish_count desc, skin_id
    ),
    '[]'::jsonb
  )
  into v_before_null_hash_wishes_by_skin
  from (
    select
      wishes.skin_id,
      count(*)::bigint as wish_count
    from public.skin_gallery_wishes wishes
    inner join public.skin_gallery_visitors visitors
      on visitors.visitor_id = wishes.visitor_id
    where visitors.visitor_secret_hash is null
    group by wishes.skin_id
  ) legacy_skin_counts;

  -- This predicate is deliberately repeated on the destructive statement.
  -- A hashed visitor is never selected merely because it appeared in an
  -- earlier observation or estimate.
  delete from public.skin_gallery_visitors
  where visitor_secret_hash is null;

  get diagnostics v_deleted_visitors = row_count;

  select
    count(*),
    count(*) filter (where visitor_secret_hash is null),
    count(*) filter (where visitor_secret_hash is not null)
  into
    v_after_visitors,
    v_after_null_hash_visitors,
    v_after_hashed_visitors
  from public.skin_gallery_visitors;

  select count(*)
  into v_after_wishes
  from public.skin_gallery_wishes;

  v_cascaded_wishes := v_before_wishes - v_after_wishes;

  select count(*)
  into v_after_orphan_wishes
  from public.skin_gallery_wishes wishes
  where not exists (
    select 1
    from public.skin_gallery_visitors visitors
    where visitors.visitor_id = wishes.visitor_id
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'skinId', skin_id,
        'wishCount', wish_count
      )
      order by wish_count desc, skin_id
    ),
    '[]'::jsonb
  )
  into v_after_wishes_by_skin
  from (
    select
      wishes.skin_id,
      count(*)::bigint as wish_count
    from public.skin_gallery_wishes wishes
    group by wishes.skin_id
  ) remaining_skin_counts;

  if v_deleted_visitors <> v_before_null_hash_visitors then
    raise exception
      'deleted visitor count mismatch: expected %, deleted %',
      v_before_null_hash_visitors,
      v_deleted_visitors;
  end if;

  if v_after_null_hash_visitors <> 0 then
    raise exception
      'NULL-hash visitors remain after cleanup: %',
      v_after_null_hash_visitors;
  end if;

  if v_after_hashed_visitors <> v_before_hashed_visitors then
    raise exception
      'hashed visitor count changed: before %, after %',
      v_before_hashed_visitors,
      v_after_hashed_visitors;
  end if;

  if v_before_visitors - v_after_visitors <> v_deleted_visitors then
    raise exception
      'visitor total delta does not match deleted rows';
  end if;

  if v_cascaded_wishes <> v_before_null_hash_wishes then
    raise exception
      'FK cascade mismatch: expected % wishes, observed %',
      v_before_null_hash_wishes,
      v_cascaded_wishes;
  end if;

  if v_after_orphan_wishes <> 0 then
    raise exception
      'orphan wishes remain after cleanup: %',
      v_after_orphan_wishes;
  end if;

  insert into pg_temp.legacy_null_hash_cleanup_audit_result (
    aggregate_record
  )
  values (
    jsonb_build_object(
      'operation', 'cleanup-legacy-credentialless-visitors',
      'observedAt', v_observed_at,
      'irreversibleByApplication', true,
      'containsVisitorIdentifiers', false,
      'before', jsonb_build_object(
        'visitorCount', v_before_visitors,
        'legacyVisitorCount', v_before_null_hash_visitors,
        'credentialedVisitorCount', v_before_hashed_visitors,
        'wishCount', v_before_wishes,
        'legacyWishCount', v_before_null_hash_wishes,
        'legacyVisitorsWithWishes', v_before_null_hash_visitors_with_wishes,
        'legacyVisitorsWithoutWishes', v_before_null_hash_visitors_without_wishes,
        'legacyWishDistribution', v_before_null_hash_wish_distribution,
        'legacyWishesBySkin', v_before_null_hash_wishes_by_skin
      ),
      'deleted', jsonb_build_object(
        'visitorCount', v_deleted_visitors,
        'cascadeWishCount', v_cascaded_wishes
      ),
      'after', jsonb_build_object(
        'visitorCount', v_after_visitors,
        'legacyVisitorCount', v_after_null_hash_visitors,
        'credentialedVisitorCount', v_after_hashed_visitors,
        'wishCount', v_after_wishes,
        'orphanWishCount', v_after_orphan_wishes,
        'wishesBySkin', v_after_wishes_by_skin
      ),
      'postCleanupReviewGate',
        'cleanup must succeed and be observed before credential enforcement review'
    )
  );
end;
$$;

commit;

-- REQUIRED: save this non-identifying result as the cleanup audit evidence.
-- Do not close the session before the result has been captured. The temporary
-- table disappears with the session and contains no UUID or token columns.
select aggregate_record
from pg_temp.legacy_null_hash_cleanup_audit_result;
