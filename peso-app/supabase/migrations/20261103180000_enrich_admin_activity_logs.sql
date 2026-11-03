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
  actor_name text;
  actor_role text;
  request_headers jsonb;
  old_row jsonb;
  new_row jsonb;
  logged_row jsonb;
  record_id text;
  record_name text;
  changed_fields text[];
  audit_fields text[];
  field_name text;
  changes jsonb := '{}'::jsonb;
  area text;
  action text;
  summary text;
  ip_address text;
  user_agent text;
  device text;
begin
  if actor_user_id is null then
    return null;
  end if;

  select admin.admin_id, admin.full_name
  into actor_admin_id, actor_name
  from public.peso_admin as admin
  where admin.user_id = actor_user_id;

  if actor_admin_id is not null then
    actor_role := 'Admin';
  else
    select staff.admin_id, staff.peso_staff_id, staff.full_name
    into actor_admin_id, actor_staff_id, actor_name
    from public.peso_staff as staff
    where staff.user_id = actor_user_id;

    if actor_staff_id is not null then
      actor_role := 'Staff';
    end if;
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

  record_name := case tg_table_name
    when 'peso_admin' then coalesce(logged_row ->> 'full_name', 'Admin account')
    when 'peso_staff' then coalesce(logged_row ->> 'full_name', 'Staff account')
    when 'staff_permissions' then coalesce(logged_row ->> 'peso_staff_id', 'Staff permissions')
    when 'job_vacancy' then coalesce(logged_row ->> 'position_title', 'Job post')
    when 'employer' then coalesce(
      logged_row ->> 'company_name',
      logged_row ->> 'business_name',
      logged_row ->> 'name',
      'Employer account'
    )
    when 'job_seeker' then coalesce(logged_row ->> 'full_name', 'Job Seeker account')
    when 'application' then coalesce(logged_row ->> 'position_title', 'Application')
    when 'peso_posts' then coalesce(logged_row ->> 'title', 'PESO post')
    when 'peso_announcements' then coalesce(logged_row ->> 'title', 'Announcement')
    else record_id
  end;

  action := case tg_table_name
    when 'peso_staff' then
      case
        when tg_op = 'INSERT' then 'Created staff account'
        when tg_op = 'DELETE' then 'Deleted staff account'
        when old_row ->> 'is_active' = 'true' and new_row ->> 'is_active' = 'false'
          then 'Deactivated staff account'
        when old_row ->> 'is_active' = 'false' and new_row ->> 'is_active' = 'true'
          then 'Activated staff account'
        else 'Updated staff account'
      end
    when 'peso_admin' then
      case
        when tg_op = 'INSERT' then 'Created admin account'
        when tg_op = 'DELETE' then 'Deleted admin account'
        when old_row ->> 'is_active' = 'true' and new_row ->> 'is_active' = 'false'
          then 'Deactivated admin account'
        when old_row ->> 'is_active' = 'false' and new_row ->> 'is_active' = 'true'
          then 'Activated admin account'
        else 'Updated admin account'
      end
    when 'staff_permissions' then
      case tg_op
        when 'INSERT' then 'Created staff permissions'
        when 'DELETE' then 'Deleted staff permissions'
        else 'Updated staff permissions'
      end
    when 'peso_posts' then
      case
        when tg_op = 'INSERT' and logged_row ->> 'status' = 'published'
          then 'Published PESO post'
        when tg_op = 'INSERT' then 'Created PESO post'
        when tg_op = 'DELETE' then 'Deleted PESO post'
        when old_row ->> 'status' = 'draft' and new_row ->> 'status' = 'published'
          then 'Published PESO post'
        when old_row ->> 'status' = 'published' and new_row ->> 'status' = 'draft'
          then 'Unpublished PESO post'
        else 'Updated PESO post'
      end
    when 'peso_announcements' then
      case tg_op
        when 'INSERT' then 'Published announcement'
        when 'DELETE' then 'Deleted announcement'
        else 'Updated announcement'
      end
    when 'job_vacancy' then
      case tg_op
        when 'INSERT' then 'Created job post'
        when 'DELETE' then 'Deleted job post'
        else 'Updated job post'
      end
    else
      case tg_op
        when 'INSERT' then 'Created ' || area
        when 'UPDATE' then 'Updated ' || area
        when 'DELETE' then 'Deleted ' || area
      end
  end;

  audit_fields := case tg_table_name
    when 'peso_admin' then array['full_name', 'email', 'is_active']
    when 'peso_staff' then array['full_name', 'email', 'is_active']
    when 'staff_permissions' then array[
      'dashboard_overview', 'analytics', 'job_posts', 'job_application',
      'employers', 'job_seekers', 'notifications'
    ]
    when 'job_vacancy' then array[
      'position_title', 'status', 'employment_type', 'location',
      'vacancies_available', 'deadline'
    ]
    when 'employer' then array['company_name', 'business_name', 'name', 'is_active', 'is_verified', 'status']
    when 'job_seeker' then array['full_name', 'is_active', 'status']
    when 'application' then array['position_title', 'status', 'application_status']
    when 'peso_posts' then array['title', 'category', 'status']
    when 'peso_announcements' then array['title']
    else array[]::text[]
  end;

  select array_agg(changed_field order by changed_field)
  into changed_fields
  from unnest(changed_fields) as changed(changed_field)
  where changed_field = any(audit_fields);

  foreach field_name in array audit_fields loop
    if field_name = any(changed_fields) then
      changes := changes || jsonb_build_object(
        field_name,
        jsonb_build_object(
          'from', case when tg_op = 'INSERT' then null else old_row -> field_name end,
          'to', case when tg_op = 'DELETE' then null else new_row -> field_name end
        )
      );
    end if;
  end loop;

  summary := action || ': "' || record_name || '"';
  if tg_op = 'UPDATE' and array_length(changed_fields, 1) > 0 then
    summary := summary || ' (changed ' || array_to_string(changed_fields, ', ') || ')';
  end if;

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
      'record_name', record_name,
      'summary', summary,
      'actor_name', actor_name,
      'actor_role', actor_role,
      'changed_fields', changed_fields,
      'changes', changes,
      'ip_address', ip_address,
      'user_agent', user_agent,
      'device', device
    )
  );

  return null;
end;
$$;
