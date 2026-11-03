drop policy if exists "Admins can view profile photos"
  on storage.objects;

create policy "Admins can view profile photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'peso-profile-photos'
  and public.is_admin()
);
