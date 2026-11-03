create or replace function public.audit_admin_staff_data_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_admin_id uuid;
  actor_staff_id uuid;
  request_headers jsonb;
  old_row jsonb;
  new_row jsonb;
  logged_row jsonb;
  record_id text;
  changed_fields text[];
  area text;
  action text;
  ip_address text;
  user_agent text;
  device text;
begin
  if actor_user_id is null then
    return null;
  end if;

  select admin.admin_id
  into actor_admin_id
  from public.peso_admin as admin
  where admin.user_id = actor_user_id;

  if actor_admin_id is null then
    select staff.admin_id, staff.peso_staff_id
    into actor_admin_id, actor_staff_id
    from public.peso_staff as staff
    where staff.user_id = actor_user_id;
  end if;

  if actor_admin_id is null then
    return null;
  end if;

  if tg_op = 'DELETE' then
    old_row := to_jsonb(old);
    logged_row := old_row;
  else
    new_row := to_jsonb(new);
    logged_row := new_row;
  end if;

  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    select array_agg(column_name order by column_name)
    into changed_fields
    from jsonb_object_keys(new_row) as changed(column_name)
    where old_row -> column_name is distinct from new_row -> column_name;

    if changed_fields is null then
      return null;
    end if;
  else
    select array_agg(column_name order by column_name)
    into changed_fields
    from jsonb_object_keys(logged_row) as changed(column_name);
  end if;

  area := case tg_table_name
    when 'job_vacancy' then 'Job Posts'
    when 'employer' then 'Employers'
    when 'job_seeker' then 'Job Seekers'
    when 'application' then 'Applications'
    when 'peso_admin' then 'Admin Accounts'
    when 'peso_staff' then 'Admin Accounts'
    when 'staff_permissions' then 'Admin Accounts'
    when 'peso_posts' then 'PESO Posts'
    when 'peso_announcements' then 'Announcements'
    else initcap(replace(tg_table_name, '_', ' '))
  end;

  action := case tg_op
    when 'INSERT' then 'Created ' || area
    when 'UPDATE' then 'Updated ' || area
    when 'DELETE' then 'Deleted ' || area
  end;

  record_id := case tg_table_name
    when 'peso_admin' then logged_row ->> 'admin_id'
    when 'peso_staff' then logged_row ->> 'peso_staff_id'
    when 'staff_permissions' then logged_row ->> 'peso_staff_id'
    when 'job_vacancy' then logged_row ->> 'job_vacancy_id'
    when 'employer' then logged_row ->> 'employer_id'
    when 'job_seeker' then logged_row ->> 'job_seeker_id'
    when 'application' then logged_row ->> 'application_id'
    else coalesce(logged_row ->> 'id', logged_row ->> 'permission_id')
  end;

  request_headers := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  user_agent := nullif(request_headers ->> 'user-agent', '');
  device := nullif(trim(both '"' from request_headers ->> 'sec-ch-ua-platform'), '');
  ip_address := coalesce(
    nullif(request_headers ->> 'cf-connecting-ip', ''),
    nullif(request_headers ->> 'x-real-ip', ''),
    nullif(btrim(split_part(coalesce(request_headers ->> 'x-forwarded-for', ''), ',', 1)), '')
  );

  insert into public.admin_activity_log (
    admin_id,
    peso_staff_id,
    action,
    details
  )
  values (
    actor_admin_id,
    actor_staff_id,
    action,
    jsonb_build_object(
      'area', area,
      'table', tg_table_name,
      'operation', tg_op,
      'record_id', record_id,
      'changed_fields', changed_fields,
      'ip_address', ip_address,
      'user_agent', user_agent,
      'device', device
    )
  );

  return null;
end;
$$;

drop trigger if exists audit_admin_staff_change on public.job_vacancy;
create trigger audit_admin_staff_change
after insert or update or delete on public.job_vacancy
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.employer;
create trigger audit_admin_staff_change
after insert or update or delete on public.employer
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.job_seeker;
create trigger audit_admin_staff_change
after insert or update or delete on public.job_seeker
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.application;
create trigger audit_admin_staff_change
after insert or update or delete on public.application
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.peso_admin;
create trigger audit_admin_staff_change
after insert or update or delete on public.peso_admin
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.peso_staff;
create trigger audit_admin_staff_change
after insert or update or delete on public.peso_staff
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.staff_permissions;
create trigger audit_admin_staff_change
after insert or update or delete on public.staff_permissions
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.peso_posts;
create trigger audit_admin_staff_change
after insert or update or delete on public.peso_posts
for each row execute function public.audit_admin_staff_data_change();

drop trigger if exists audit_admin_staff_change on public.peso_announcements;
create trigger audit_admin_staff_change
after insert or update or delete on public.peso_announcements
for each row execute function public.audit_admin_staff_data_change();
