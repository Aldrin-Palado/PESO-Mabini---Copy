drop policy if exists "Staff can update own record" on public.peso_staff;

create policy "Staff can update own record"
on public.peso_staff
for update
to authenticated
using (user_id = auth.uid() and is_active = true)
with check (user_id = auth.uid() and is_active = true);
