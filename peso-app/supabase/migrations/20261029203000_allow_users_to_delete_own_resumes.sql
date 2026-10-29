drop policy if exists "Users can delete their own resumes"
on storage.objects;

create policy "Users can delete their own resumes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'Resume Files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
