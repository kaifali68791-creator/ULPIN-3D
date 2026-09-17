-- =====================================================================
-- PHASE 2 — USER MANAGEMENT SECURITY HARDENING (public.profiles)
-- Additive only. No table, column, policy, index or trigger is dropped or
-- redefined. Nothing from the Phase 1 migration is rewritten.
--
-- This migration closes exactly two least-privilege gaps that were left in
-- place by the Supabase platform-wide DEFAULT PRIVILEGES on the new table:
--
--   1. TABLE PRIVILEGES
--      The authenticated role still held INSERT / DELETE / TRUNCATE /
--      REFERENCES / TRIGGER on public.profiles. Row Level Security does NOT
--      govern TRUNCATE — a role holding it can empty the table while every
--      policy is ignored — and none of these five privileges is ever needed
--      by a browser client. Profile rows are created ONLY by the SECURITY
--      DEFINER provisioning trigger public.handle_new_auth_user_profile and
--      removed ONLY by the auth.users ON DELETE CASCADE, both of which run
--      with the privileges of their owner, not of the authenticated role.
--      Only SELECT + UPDATE are kept, so the existing own-row / admin RLS
--      policies keep behaving exactly as they did in Phase 1.
--
--   2. FUNCTION EXECUTE PRIVILEGES
--      PostgreSQL grants EXECUTE on every new function to PUBLIC by
--      default, which meant the anon (signed-out) role could also call the
--      SECURITY DEFINER helpers. EXECUTE is now restricted to the roles that
--      genuinely need it: authenticated (required for RLS policy
--      evaluation) and service_role. Anonymous clients can no longer call
--      them at all.
--
-- Deliberately NOT changed (and why):
--   * UPDATE stays a table-wide grant. Column restriction is already
--     enforced by the authoritative public.profiles_guard_self_update()
--     trigger, and narrowing UPDATE to a column grant would break the
--     admin's ability to change role/status in a later phase.
--   * No INSERT and no DELETE policy is added — clients must never create
--     or delete profile rows.
--   * The two trigger functions keep their existing EXECUTE grants:
--     PostgreSQL refuses to call a trigger function outside a trigger
--     context, and revoking them could risk the auth.users signup
--     provisioning path. No real exposure remains.
--   * public.problem_reports, its columns, its policies and its migration
--     are NOT touched.
--   * No frontend file, no role name and no existing behaviour is changed.
--
-- Database role names stay: admin | revenue_officer | surveyor | citizen
-- =====================================================================

-- ---------- 1. TABLE PRIVILEGES — LEAST PRIVILEGE ---------------------
-- A browser client may only read (RLS-filtered) and update (trigger-guarded).
revoke insert, delete, truncate, references, trigger on public.profiles from authenticated;

-- The anonymous (signed-out) role keeps no access whatsoever.
revoke all on public.profiles from anon;

-- Re-assert the only two privileges the application genuinely uses.
grant select, update on public.profiles to authenticated;

-- ---------- 2. FUNCTION PRIVILEGES — NO ANONYMOUS EXECUTE -------------
-- SECURITY DEFINER helpers referenced by the public.profiles RLS policies.
revoke execute on function public.is_admin()  from public, anon;
revoke execute on function public.is_active() from public, anon;
grant  execute on function public.is_admin()  to authenticated, service_role;
grant  execute on function public.is_active() to authenticated, service_role;
