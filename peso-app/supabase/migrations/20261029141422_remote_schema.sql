SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    user_role text;
    user_full_name text;
    user_company_name text;
    user_email text;
    user_address text;
    user_contact_person text;
    user_contact_no text;
begin
    user_role := new.raw_user_meta_data->>'role';
    user_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');
    user_company_name := coalesce(new.raw_user_meta_data->>'company_name', '');
    user_email := new.email;
    user_address := coalesce(new.raw_user_meta_data->>'business_address', '');
    user_contact_person := coalesce(
        new.raw_user_meta_data->>'contact_person',
        user_full_name
    );
    user_contact_no := coalesce(new.raw_user_meta_data->>'contact_no', '');

    if user_role = 'jobseeker' then
        insert into public.job_seeker (
            user_id,
            full_name,
            email,
            address,
            contact_no,
            birth_date,
            registration_details,
            is_active
        )
        values (
            new.id,
            user_full_name,
            user_email,
            nullif(new.raw_user_meta_data->>'address', ''),
            nullif(new.raw_user_meta_data->>'contact_no', ''),
            nullif(new.raw_user_meta_data->>'birth_date', '')::date,
            coalesce(new.raw_user_meta_data->'registration_details', '{}'::jsonb),
            true
        )
        on conflict (user_id) do nothing;

    elsif user_role = 'employer' then
        insert into public.employer (
            user_id,
            name,
            address,
            contact_person,
            contact_no,
            email
        )
        values (
            new.id,
            user_company_name,
            user_address,
            user_contact_person,
            user_contact_no,
            user_email
        )
        on conflict (user_id) do nothing;
    end if;

    return new;
end;
$function$;

CREATE POLICY "Employers can insert their own job vacancies" ON "public"."job_vacancy"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((employer_id IN ( SELECT employer.employer_id
   FROM public.employer
  WHERE (employer.user_id = auth.uid()))));