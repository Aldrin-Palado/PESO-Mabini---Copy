drop policy if exists "Staff and admins can view resumes"
on storage.objects;

create policy "Staff and admins can view resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'Resume Files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.peso_staff s
      join public.staff_permissions p
        on p.peso_staff_id = s.peso_staff_id
      where s.user_id = (select auth.uid())
        and s.is_active
        and p.job_seekers
    )
  )
);
