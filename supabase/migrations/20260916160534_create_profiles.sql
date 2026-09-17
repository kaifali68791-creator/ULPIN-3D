-- =====================================================================
-- PHASE 1 — REAL USER MANAGEMENT FOUNDATION (public.profiles)
-- Additive only. This migration:
--   1. creates public.profiles keyed to auth.users(id)
--   2. role/status CHECK constraints + indexes for future User Management
--   3. SECURITY DEFINER helpers public.is_admin() / public.is_active()
--   4. enables RLS with own-row + admin policies
--   5. blocks role/status self-promotion at the DATABASE level (trigger)
--   6. auto-provisions a profiles row for every new auth.users row
--   7. backfills the existing auth.users population (defaults to citizen)
--
-- It does NOT touch public.problem_reports, its columns/policies/migration,
-- and it does NOT touch any frontend file.
--
-- Database role names: admin | revenue_officer | surveyor | citizen
-- (Frontend role keys are mapped later: revenue_officer -> revenue,
--  surveyor -> gis, citizen -> planning. No frontend key is renamed here.)
-- =====================================================================

-- ---------- 1. TABLE -------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  role         text not null default 'citizen'
                 check (role in ('admin', 'revenue_officer', 'surveyor', 'citizen')),
  status       text not null default 'active'
                 check (status in ('active', 'suspended')),
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Real application user profiles, 1:1 with auth.users. Source of truth for role/status in User Management.';

-- ---------- 2. INDEXES (future User Management queries) --------------
create index if not exists profiles_role_status_idx
  on public.profiles (role, status);
create index if not exists profiles_last_seen_at_idx
  on public.profiles (last_seen_at);

-- ---------- 3. HELPER: public.is_admin() -----------------------------
-- True only when the CURRENT authenticated user has a profiles row whose
-- role is 'admin'. SECURITY DEFINER + pinned empty search_path so it can
-- read public.profiles safely from inside RLS policies without recursion.
-- Returns false when there is no authenticated user or no profile row.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------- 4. HELPER: public.is_active() ----------------------------
-- True only when the CURRENT authenticated user has a profiles row with
-- status = 'active' (used to enforce suspension server-side later).
-- Returns false when there is no authenticated user or no profile row.
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

-- ---------- 5. ROW LEVEL SECURITY ------------------------------------
alter table public.profiles enable row level security;

-- Least privilege: the anonymous (signed-out) role gets no access at all.
revoke all on public.profiles from anon;

-- ---------- 6. POLICIES ----------------------------------------------
-- SELECT: an authenticated user may read their own profile.
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- SELECT: an authenticated admin may read every profile (User Management).
create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- UPDATE: an authenticated user may update their own row. Column-level
-- restriction (only last_seen_at may actually change) is enforced by the
-- guard trigger in section 7 — a policy alone cannot restrict columns.
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE: an authenticated admin may manage profiles (role/status/restore).
create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT policy on purpose: rows are created ONLY by the auth.users
-- provisioning trigger (SECURITY DEFINER), never by a client.
-- No DELETE policy on purpose: profiles are removed by the auth.users
-- ON DELETE CASCADE, never by a client.

-- ---------- 7. BLOCK SELF-PROMOTION (database-level, authoritative) ---
-- A normal authenticated user may change ONLY their own last_seen_at.
-- They can never change their own role, status, email or id — regardless
-- of what the frontend sends. Admins (by profile role) may change
-- role/status of users. Database-context operations (SQL editor, CLI,
-- service role, migrations — where auth.uid() is NULL) remain allowed, so
-- the database owner is always authoritative.
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

create or replace trigger profiles_guard_self_update_trigger
  before update on public.profiles
  for each row
  execute function public.profiles_guard_self_update();

-- ---------- 8. AUTO-PROVISION PROFILES FOR NEW AUTH USERS ------------
-- Every brand-new auth.users row gets exactly one profiles row.
-- Role ALWAYS defaults to 'citizen' — a new user can never be created as
-- admin / revenue_officer / surveyor automatically.
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
    'citizen',
    'active',
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_profile();

-- ---------- 9. GRANTS ------------------------------------------------
grant select, update on public.profiles to authenticated;

-- ---------- 10. BACKFILL EXISTING AUTH USERS -------------------------
-- Preserves the three already-authorized role accounts; every other
-- existing account (and all future accounts) defaults to citizen.
-- created_at is copied from the auth user where available.
insert into public.profiles (id, email, full_name, avatar_url, role, status, created_at)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'picture',
  case lower(coalesce(u.email, ''))
    when 'kaifali68791@gmail.com' then 'admin'
    when 'ffpr121@gmail.com'      then 'revenue_officer'
    when 'k8875349@gmail.com'     then 'surveyor'
    else 'citizen'
  end,
  'active',
  coalesce(u.created_at, now())
from auth.users u
on conflict (id) do nothing;

-- Idempotent safety net: if a profile row for one of the authorized
-- accounts already existed, make sure it carries its known role.
update public.profiles
   set role = case lower(email)
                when 'kaifali68791@gmail.com' then 'admin'
                when 'ffpr121@gmail.com'      then 'revenue_officer'
                when 'k8875349@gmail.com'     then 'surveyor'
                else role
              end
 where lower(email) in ('kaifali68791@gmail.com', 'ffpr121@gmail.com', 'k8875349@gmail.com');
