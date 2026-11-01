alter table public.employer
  add column if not exists logo_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'employer-logos',
  'employer-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view employer logos"
  on storage.objects;
create policy "Public can view employer logos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'employer-logos');

drop policy if exists "Employers can upload their own company logos"
  on storage.objects;
create policy "Employers can upload their own company logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'employer-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Employers can update their own company logos"
  on storage.objects;
create policy "Employers can update their own company logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'employer-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'employer-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Employers can delete their own company logos"
  on storage.objects;
create policy "Employers can delete their own company logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'employer-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
