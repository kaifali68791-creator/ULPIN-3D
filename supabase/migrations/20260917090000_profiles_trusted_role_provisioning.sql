-- =====================================================================
-- PHASE 3B — TRUSTED STAFF ROLE PROVISIONING (public.profiles)
-- Additive only. NO other migration is edited. No table, column, constraint,
-- index, policy, trigger name, grant or existing role/status value is dropped
-- or weakened.
--
-- 1. SERVER-SIDE ROLE ASSIGNMENT
--    public.handle_new_auth_user_profile() is REPLACED with `create or replace`
--    (same function name/signature, so the existing function OID and its Phase 1
--    / Phase 2 ACL are preserved). The auth.users -> public.profiles provisioning
--    path now assigns the role SERVER-SIDE from this EXACT trusted mapping only:
--
--        kaifali68791@gmail.com -> admin
--        ffpr121@gmail.com      -> revenue_officer
--        k8875349@gmail.com     -> surveyor
--        every other email      -> citizen
--
--    The function keeps its security model unchanged:
--      * security definer
--      * set search_path = ''            (pinned — no search_path hijack)
--      * only ever called by the AFTER INSERT trigger on auth.users, so it is
--        NOT an RPC: a browser client can never call it, and therefore a user
--        can never choose, request or self-promote to a staff role.
--
-- 2. ONE-TIME BOOTSTRAP REPAIR (deliberately narrow)
--    Rows created by the PREVIOUS provisioning trigger before this migration
--    were always inserted as 'citizen'. Only those three trusted addresses are
--    re-aligned to their mapped role, and ONLY while the row still holds the
--    'citizen' default — an existing admin / revenue_officer / surveyor value
--    (including one set deliberately from the database) is never overwritten.
--    status is NOT touched at all, so a suspended user stays suspended and is
--    never re-activated; last_seen_at / created_at / id / email are untouched.
--
-- Deliberately NOT changed (and why):
--   * public.profiles RLS policies (profiles_select_own, profiles_select_admin,
--     profiles_update_own, profiles_update_admin) — untouched. No policy is
--     added, relaxed or dropped, so the hardening from the earlier migrations
--     is preserved exactly.
--   * public.profiles_guard_self_update() — untouched, so a normal authenticated
--     user can still change ONLY last_seen_at on their own row (no role/status
--     self-promotion, no status change, no re-activation).
--   * public.is_admin() / public.is_active() and their EXECUTE grants — untouched.
--   * No INSERT / DELETE / TRUNCATE privilege is granted to any client role and
--     no anon access is added anywhere.
--   * No role-changing RPC/function is created or exposed to normal users.
--   * public.problem_reports and every unrelated object are NOT touched.
--
-- Database role vocabulary stays: admin | revenue_officer | surveyor | citizen
-- (frontend keys remain admin | revenue | gis | planning — mapped in the
--  frontend, never renamed here).
-- =====================================================================

-- ---------- 1. PROVISIONING TRIGGER FUNCTION (server-side role) ------
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, status, created_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'picture',
    /* Trusted, server-side role assignment — the ONE and only place a staff
       role is granted. Anything not on this exact list is 'citizen'. The
       email is compared lowercased, so the match is case-insensitive while
       the mapping itself stays exact. */
    case lower(coalesce(new.email, ''))
      when 'kaifali68791@gmail.com' then 'admin'
      when 'ffpr121@gmail.com'      then 'revenue_officer'
      when 'k8875349@gmail.com'     then 'surveyor'
      else 'citizen'
    end,
    /* New rows only. This trigger runs on INSERT and can therefore never
       re-activate a suspended account: ON CONFLICT DO NOTHING means an
       existing row (and its status) is never modified. */
    'active',
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- 2. RE-ASSERT THE PROVISIONING TRIGGER --------------------
-- `create or replace trigger` (no DROP) guarantees the provisioning path is
-- attached to the function above, with no window in which a signup could miss
-- its profiles row. The trigger name and timing are unchanged.
create or replace trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_profile();

-- ---------- 3. ONE-TIME BOOTSTRAP REPAIR (trusted emails only) -------
-- Narrow on purpose:
--   * only the three exact trusted addresses,
--   * only rows that still hold the 'citizen' default left by the previous
--     provisioning trigger (a real staff role already in the row wins),
--   * role only — status, last_seen_at, created_at, id and email untouched,
--     so a suspended user is never re-activated.
-- Runs in the migration context, where auth.uid() is NULL, so the Phase 1
-- guard trigger allows it (exactly like the Phase 1 backfill did).
update public.profiles p
   set role = case lower(p.email)
                when 'kaifali68791@gmail.com' then 'admin'
                when 'ffpr121@gmail.com'      then 'revenue_officer'
                when 'k8875349@gmail.com'     then 'surveyor'
                else p.role
              end
 where p.role = 'citizen'
   and lower(p.email) in ('kaifali68791@gmail.com', 'ffpr121@gmail.com', 'k8875349@gmail.com');