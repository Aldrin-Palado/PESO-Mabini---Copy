insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'peso-profile-photos',
  'peso-profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view their own profile photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'peso-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'peso-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their own profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'peso-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'peso-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
