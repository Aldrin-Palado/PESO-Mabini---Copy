insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'Resume Files',
  'Resume Files',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own resumes"
on storage.objects;
drop policy if exists "Users can view their own resumes"
on storage.objects;

create policy "Users can upload their own resumes"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'Resume Files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can view their own resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'Resume Files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
