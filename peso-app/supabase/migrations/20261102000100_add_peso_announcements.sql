create table if not exists public.peso_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_peso_announcements_created_at
  on public.peso_announcements (created_at desc);
alter table public.peso_announcements enable row level security;
drop policy if exists "Public can view PESO announcements"
  on public.peso_announcements;
create policy "Public can view PESO announcements"
on public.peso_announcements
for select
to anon, authenticated
using (true);
drop policy if exists "PESO content staff can create announcements"
  on public.peso_announcements;
create policy "PESO content staff can create announcements"
on public.peso_announcements
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.peso_staff staff
    join public.staff_permissions permissions
      on permissions.peso_staff_id = staff.peso_staff_id
    where staff.user_id = auth.uid()
      and staff.is_active
      and permissions.notifications
  )
);
drop policy if exists "PESO content staff can delete announcements"
  on public.peso_announcements;
create policy "PESO content staff can delete announcements"
on public.peso_announcements
for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.peso_staff staff
    join public.staff_permissions permissions
      on permissions.peso_staff_id = staff.peso_staff_id
    where staff.user_id = auth.uid()
      and staff.is_active
      and permissions.notifications
  )
);
grant select on public.peso_announcements to anon, authenticated;
grant insert, delete on public.peso_announcements to authenticated;
