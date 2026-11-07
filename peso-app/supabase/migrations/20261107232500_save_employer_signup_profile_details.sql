CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  user_full_name text;
  user_company_name text;
  user_email text;
  user_address text;
  user_contact_person text;
  user_contact_no text;
  employer_details jsonb;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  user_full_name := coalesce(NEW.raw_user_meta_data->>'full_name', '');
  user_company_name := coalesce(NEW.raw_user_meta_data->>'company_name', '');
  user_email := NEW.email;
  user_address := coalesce(NEW.raw_user_meta_data->>'business_address', '');
  user_contact_person := coalesce(
    NEW.raw_user_meta_data->>'contact_person',
    user_full_name
  );
  user_contact_no := coalesce(NEW.raw_user_meta_data->>'contact_no', '');
  employer_details := coalesce(
    NEW.raw_user_meta_data->'employer_registration_details',
    '{}'::jsonb
  );

  IF user_role = 'jobseeker' THEN
    INSERT INTO public.job_seeker (
      user_id,
      full_name,
      email,
      address,
      contact_no,
      birth_date,
      registration_details,
      is_active
    )
    VALUES (
      NEW.id,
      user_full_name,
      user_email,
      nullif(NEW.raw_user_meta_data->>'address', ''),
      nullif(NEW.raw_user_meta_data->>'contact_no', ''),
      nullif(NEW.raw_user_meta_data->>'birth_date', '')::date,
      coalesce(NEW.raw_user_meta_data->'registration_details', '{}'::jsonb),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'employer' THEN
    INSERT INTO public.employer (
      user_id,
      name,
      address,
      contact_person,
      contact_no,
      email,
      registration_details,
      industry,
      website,
      company_description
    )
    VALUES (
      NEW.id,
      user_company_name,
      user_address,
      user_contact_person,
      user_contact_no,
      user_email,
      employer_details,
      (
        SELECT string_agg(industries.value, ', ')
        FROM jsonb_array_elements_text(
          coalesce(employer_details->'industries', '[]'::jsonb)
        ) AS industries(value)
      ),
      nullif(employer_details->>'website', ''),
      nullif(employer_details->>'company_description', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
