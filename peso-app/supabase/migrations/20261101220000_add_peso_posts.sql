create table if not exists public.peso_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'Activities',
  image_url text,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint peso_posts_status_check check (status in ('published', 'draft')),
  constraint peso_posts_category_check check (
    category in ('Activities', 'Achievements', 'Events', 'Programs')
  )
);

drop trigger if exists trg_peso_posts_updated_at on public.peso_posts;
create trigger trg_peso_posts_updated_at
before update on public.peso_posts
for each row
execute function public.set_updated_at();

alter table public.peso_posts enable row level security;

drop policy if exists "Public can view published PESO posts" on public.peso_posts;
create policy "Public can view published PESO posts"
on public.peso_posts
for select
to anon, authenticated
using (status = 'published' or public.is_staff_or_admin());

drop policy if exists "PESO content staff can create posts" on public.peso_posts;
create policy "PESO content staff can create posts"
on public.peso_posts
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

drop policy if exists "PESO content staff can update posts" on public.peso_posts;
create policy "PESO content staff can update posts"
on public.peso_posts
for update
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
)
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

drop policy if exists "PESO content staff can delete posts" on public.peso_posts;
create policy "PESO content staff can delete posts"
on public.peso_posts
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

grant select on public.peso_posts to anon, authenticated;
grant insert, update, delete on public.peso_posts to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'peso-post-images',
  'peso-post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view PESO post images" on storage.objects;
create policy "Public can view PESO post images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'peso-post-images');

drop policy if exists "PESO content staff can upload post images" on storage.objects;
create policy "PESO content staff can upload post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'peso-post-images'
  and (
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
  )
);

drop policy if exists "PESO content staff can update post images" on storage.objects;
create policy "PESO content staff can update post images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'peso-post-images'
  and (
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
  )
)
with check (
  bucket_id = 'peso-post-images'
  and (
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
  )
);

drop policy if exists "PESO content staff can delete post images" on storage.objects;
create policy "PESO content staff can delete post images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'peso-post-images'
  and (
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
  )
);
