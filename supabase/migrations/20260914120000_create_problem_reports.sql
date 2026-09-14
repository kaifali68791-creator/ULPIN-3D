-- Cross-device persistence for the Citizen "Report Problem" module (additive).
-- Preserves every field the existing Admin Reports UI already renders:
-- ticket id, reporter info, category, description, location, attachment
-- metadata + (optionally) the small base64 attachment payload, status,
-- timestamps, admin remarks. The existing localStorage cache is untouched.
create table if not exists public.problem_reports (
  id                 text primary key,             -- existing ticket ID (RP-...)
  category           text not null,
  ulpin              text,
  description        text not null,
  location           text,
  file_name          text,
  file_type          text,
  file_size          bigint,
  attachment_data    text,                          -- small base64 data URL (<= ~500 KB), as today
  status             text not null default 'Submitted',
  created_at         timestamptz not null default now(),
  reporter_role      text,
  reporter_role_name text,
  reporter_email     text,
  admin_remarks      text default '',
  status_updated_at  timestamptz,
  remarks_updated_at timestamptz,
  user_id            uuid default auth.uid()       -- submitting Supabase Auth user
);

alter table public.problem_reports enable row level security;

-- Insert: any authenticated (Google/Supabase) user may submit their own report.
drop policy if exists "problem_reports_insert_authenticated" on public.problem_reports;
create policy "problem_reports_insert_authenticated"
  on public.problem_reports for insert to authenticated
  with check (user_id = auth.uid());

-- Select: the report owner (by submitting user) or the configured Admin account.
drop policy if exists "problem_reports_select_owner_or_admin" on public.problem_reports;
create policy "problem_reports_select_owner_or_admin"
  on public.problem_reports for select to authenticated
  using (
    user_id = auth.uid()
    or lower(auth.jwt() ->> 'email') = 'kaifali68791@gmail.com'
  );

-- Update / delete: only the configured Admin account (matches the existing
-- frontend role mapping in js/googleAuth.js; demo/non-admin roles cannot
-- mutate reports at the database level).
drop policy if exists "problem_reports_update_admin" on public.problem_reports;
create policy "problem_reports_update_admin"
  on public.problem_reports for update to authenticated
  using (lower(auth.jwt() ->> 'email') = 'kaifali68791@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'kaifali68791@gmail.com');

drop policy if exists "problem_reports_delete_admin" on public.problem_reports;
create policy "problem_reports_delete_admin"
  on public.problem_reports for delete to authenticated
  using (lower(auth.jwt() ->> 'email') = 'kaifali68791@gmail.com');

-- Ensure the authenticated role has the needed grants (Supabase default
-- privileges normally cover this; explicit grants make the migration robust).
grant select, insert, update, delete on public.problem_reports to authenticated;
