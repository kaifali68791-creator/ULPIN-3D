-- =====================================================================
-- PHASE 6A — SECURE SERVER-SIDE SUSPEND / RESTORE (public.profiles)
-- One new, narrowly scoped SECURITY DEFINER function that changes ONLY
-- public.profiles.status. Everything else in this phase is verification.
--
-- Deliberately NOT changed (and why):
--   * public.profiles RLS policies — untouched. The existing four policies
--     (profiles_select_own, profiles_select_admin, profiles_update_own,
--     profiles_update_admin) keep their exact definitions. This function
--     does not weaken them: it is the ONLY controlled write path for
--     status, and its single UPDATE is performed by the definer role
--     (postgres, which already owns the table) — no new policy, no grant,
--     no broad UPDATE permission for any client role.
--   * public.profiles_guard_self_update() — untouched. A normal
--     authenticated user still cannot change their own status (the guard
--     raises before any status change reaches the row), and the guard
--     already allows an admin caller through, which is exactly the path
--     this function uses.
--   * public.is_admin() — REUSED unchanged as the admin check. A second
--     definition of "admin" is deliberately not created.
--   * No audit-log table is created (none exists; out of scope).
--   * No role/email/full_name/avatar_url/last_seen_at/created_at write
--     exists anywhere in this file. No dynamic SQL, no EXECUTE of strings.
--   * No application file is touched; no frontend RPC is wired yet.
--
-- SELF-SUSPENSION POLICY (deliberate, derived from the live project):
--   The live profiles table holds exactly ONE admin account. Suspending
--   any admin account would (a) allow the only admin to lock themselves
--   out and (b) leave no active administrator able to restore from the
--   User Management UI. Therefore this function REFUSES to suspend any
--   profile whose role is 'admin' — which includes the caller's own row
--   (self-suspension). Restoring an admin ('active') stays allowed.
--   Status values remain exactly: active | suspended (CHECK constraint).
-- =====================================================================

-- ---------- 1. THE FUNCTION ------------------------------------------
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
  /* 1. Caller identity. This function is SECURITY DEFINER, so it runs with
        the owner's privileges — the caller's identity MUST therefore come
        from their verified JWT (auth.uid()), never from a parameter. */
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  /* 2. Admin check — the EXISTING Phase 1 helper public.is_admin() is
        reused. No second definition of admin exists or is created. */
  if not public.is_admin() then
    raise exception 'Only an administrator may change an account status.' using errcode = '42501';
  end if;

  /* 3. Whitelist. Anything else — including NULL, empty or mixed case —
        is rejected before any lookup or write happens. */
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

  /* 5. Self-suspension / last-admin lockout protection (see header). */
  if v_target_role = 'admin' and new_status = 'suspended' then
    raise exception 'Administrator accounts cannot be suspended.' using errcode = 'P0001';
  end if;

  /* 6. The ONLY write this function can ever perform. The SET clause
        names exactly one column; role, email, full_name, avatar_url,
        last_seen_at and created_at can never change through this path.
        The existing BEFORE UPDATE guard also runs and permits this
        update only because the caller IS an admin. */
  update public.profiles
     set status = new_status
   where id = target_profile_id;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Account status could not be updated.' using errcode = 'P0001';
  end if;

  /* 7. A small, self-describing result for the (future) admin UI. */
  return jsonb_build_object(
    'profile_id',      target_profile_id,
    'previous_status', v_previous_status,
    'new_status',      new_status
  );
end;
$$;

comment on function public.admin_set_profile_status(uuid, text) is
  'PHASE 6A: admin-only suspend/restore. Changes ONLY public.profiles.status to ''active'' or ''suspended''. Refuses non-admins, unauthenticated callers, unknown targets and admin targets (self-suspension / last-admin lockout protection). Security definer, pinned empty search_path, static SQL only.';

-- ---------- 2. EXECUTE PRIVILEGES (least privilege) ------------------
-- PostgreSQL grants EXECUTE on every new function to PUBLIC by default.
-- This function must be callable ONLY by signed-in users; even then it
-- re-checks admin server-side, so EXECUTE alone grants no power.
revoke execute on function public.admin_set_profile_status(uuid, text) from public;
revoke execute on function public.admin_set_profile_status(uuid, text) from anon;
revoke execute on function public.admin_set_profile_status(uuid, text) from service_role;
grant  execute on function public.admin_set_profile_status(uuid, text) to authenticated;
