-- =====================================================================
-- PHASE 6C — SERVER-SIDE SUSPENSION ENFORCEMENT (database writes fail closed)
-- Additive hardening only. No previous migration file is edited. No table,
-- column, constraint, index or trigger name is dropped. No frontend file is
-- touched. No service-role credential is introduced. No Auth config changed.
-- No audit-log table is created. Reuses existing public.is_active() only.
--
-- Changes (exactly four, see full header in part 2 below):
--   1. problem_reports INSERT policy gains AND public.is_active()
--   2. profiles "profiles_update_own" policy gains AND public.is_active()
--   3. public.profiles_guard_self_update() denies suspended non-admin writes
--   4. public.admin_set_profile_status() requires an ACTIVE admin caller
--
-- AUTH LIMITATION (expected): suspension does NOT log the user out. The
-- JWT/session may remain valid and reads may remain allowed. Database writes
-- fail for suspended users, last_seen_at stops updating, presence ages to
-- Offline. Session invalidation is NOT implemented here.
-- =====================================================================

-- ---------- 1. problem_reports INSERT: require an active caller ----------
-- Ownership preserved (user_id = auth.uid()); active check added as a
-- conjunct. Both js/app.js upsert paths go through INSERT, so both fail
-- closed for suspended users.
drop policy if exists "problem_reports_insert_authenticated" on public.problem_reports;
create policy "problem_reports_insert_authenticated"
  on public.problem_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_active()
  );

-- ---------- 2. profiles self-UPDATE: require an active caller ------------
-- Both USING and WITH CHECK gain the conjunct. Admin policy untouched.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (
    auth.uid() = id
    and public.is_active()
  )
  with check (
    auth.uid() = id
    and public.is_active()
  );

-- ---------- 3. profiles guard trigger: deny suspended non-admin writes ---
-- Identical to the Phase 1 body except for the single added active-user check
-- on the normal non-admin own-row path (after the own-row check, before the
-- column checks). NULL-uid (migration/service) and admin paths return exactly
-- as before, so admins are never blocked from managing users.
create or replace function public.profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- No authenticated end-user: trusted database-level administration.
  if v_uid is null then
    return new;
  end if;

  -- Authorized admin: full user management (role/status of other users).
  if public.is_admin() then
    return new;
  end if;

  -- Normal authenticated user: own row only.
  if v_uid <> new.id then
    raise exception 'Not authorized to modify this profile row';
  end if;

  -- PHASE 6C: a suspended (inactive) user cannot update their own row at all,
  -- including last_seen_at. Mirrors the "profiles_update_own" policy so
  -- policy and trigger agree (defence in depth).
  if not public.is_active() then
    raise exception 'Account is suspended.' using errcode = '42501';
  end if;

  -- Only last_seen_at may differ. Everything else is refused.
  if new.role is distinct from old.role then
    raise exception 'Not authorized to change role';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Not authorized to change account status';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Not authorized to change email';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Not authorized to change profile id';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'Not authorized to change created_at';
  end if;
  if new.full_name is distinct from old.full_name then
    raise exception 'Not authorized to change full_name';
  end if;
  if new.avatar_url is distinct from old.avatar_url then
    raise exception 'Not authorized to change avatar_url';
  end if;

  return new;
end;
$$;



-- ---------- 4. admin status RPC: caller must be an ACTIVE admin ----------
-- Identical signature, security model and body to Phase 6A except for the
-- single added caller-active check immediately after the admin check
-- (step 2b). Whitelist, target existence, admin-target protection,
-- single-column status-only UPDATE and static SQL are preserved exactly.
create or replace function public.admin_set_profile_status(target_profile_id uuid, new_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller          uuid;
  v_target_role     text;
  v_previous_status text;
  v_updated         integer;
begin
  /* 1. Caller identity from the verified JWT, never from a parameter. */
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  /* 2. Admin check — the EXISTING Phase 1 helper, reused unchanged. */
  if not public.is_admin() then
    raise exception 'Only an administrator may change an account status.' using errcode = '42501';
  end if;

  /* 2b. PHASE 6C: the calling admin must themselves be active. */
  if not public.is_active() then
    raise exception 'Suspended accounts cannot change an account status.' using errcode = '42501';
  end if;

  /* 3. Whitelist. Anything else is rejected before any lookup or write. */
  if new_status is distinct from 'active' and new_status is distinct from 'suspended' then
    raise exception 'Status must be exactly ''active'' or ''suspended''.' using errcode = '22023';
  end if;

  /* 4. The target profile must exist. */
  select p.role, p.status
    into v_target_role, v_previous_status
    from public.profiles p
   where p.id = target_profile_id;
  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  /* 5. Self-suspension / last-admin lockout protection (unchanged). */
  if v_target_role = 'admin' and new_status = 'suspended' then
    raise exception 'Administrator accounts cannot be suspended.' using errcode = 'P0001';
  end if;

  /* 6. The ONLY write: exactly one column (status). */
  update public.profiles
     set status = new_status
   where id = target_profile_id;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Account status could not be updated.' using errcode = 'P0001';
  end if;

  /* 7. Small self-describing result for the admin UI. */
  return jsonb_build_object(
    'profile_id',      target_profile_id,
    'previous_status', v_previous_status,
    'new_status',      new_status
  );
end;
$$;

comment on function public.admin_set_profile_status(uuid, text) is
  'PHASE 6A + 6C: admin-only suspend/restore. Changes ONLY public.profiles.status. Refuses unauthenticated callers, non-admins, INACTIVE (suspended) admin callers, unknown targets and admin targets. Security definer, pinned empty search_path, static SQL only.';

-- ---------- 5. LEAST-PRIVILEGE RE-ASSERTION (no broadening) --------------
-- Recreated functions keep their existing EXECUTE posture: the status RPC
-- stays callable ONLY by signed-in users (server-side checks still apply).
-- These statements only revoke what must never be present; they never grant
-- INSERT/DELETE/TRUNCATE or anon access anywhere.
revoke execute on function public.admin_set_profile_status(uuid, text) from public;
revoke execute on function public.admin_set_profile_status(uuid, text) from anon;
revoke execute on function public.admin_set_profile_status(uuid, text) from service_role;
grant  execute on function public.admin_set_profile_status(uuid, text) to authenticated;

-- Table privileges re-asserted narrowly (idempotent, no broadening).
revoke insert, delete, truncate, references, trigger on public.profiles from authenticated;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
revoke all on public.problem_reports from anon;
grant select, insert, update, delete on public.problem_reports to authenticated;
