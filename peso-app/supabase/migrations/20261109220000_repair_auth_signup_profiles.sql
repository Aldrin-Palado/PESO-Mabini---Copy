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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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
SELECT
  auth_user.id,
  coalesce(auth_user.raw_user_meta_data->>'full_name', ''),
  auth_user.email,
  nullif(auth_user.raw_user_meta_data->>'address', ''),
  nullif(auth_user.raw_user_meta_data->>'contact_no', ''),
  nullif(auth_user.raw_user_meta_data->>'birth_date', '')::date,
  coalesce(auth_user.raw_user_meta_data->'registration_details', '{}'::jsonb),
  true
FROM auth.users AS auth_user
WHERE auth_user.raw_user_meta_data->>'role' = 'jobseeker'
  AND NOT EXISTS (
    SELECT 1
    FROM public.job_seeker AS profile
    WHERE profile.user_id = auth_user.id
       OR (
         auth_user.email IS NOT NULL
         AND lower(profile.email) = lower(auth_user.email)
       )
  )
ON CONFLICT (user_id) DO NOTHING;

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
SELECT
  auth_user.id,
  coalesce(auth_user.raw_user_meta_data->>'company_name', ''),
  coalesce(auth_user.raw_user_meta_data->>'business_address', ''),
  coalesce(
    auth_user.raw_user_meta_data->>'contact_person',
    auth_user.raw_user_meta_data->>'full_name',
    ''
  ),
  coalesce(auth_user.raw_user_meta_data->>'contact_no', ''),
  auth_user.email,
  coalesce(
    auth_user.raw_user_meta_data->'employer_registration_details',
    '{}'::jsonb
  ),
  (
    SELECT string_agg(industries.value, ', ')
    FROM jsonb_array_elements_text(
      coalesce(
        auth_user.raw_user_meta_data->'employer_registration_details'->'industries',
        '[]'::jsonb
      )
    ) AS industries(value)
  ),
  nullif(
    auth_user.raw_user_meta_data->'employer_registration_details'->>'website',
    ''
  ),
  nullif(
    auth_user.raw_user_meta_data->'employer_registration_details'->>'company_description',
    ''
  )
FROM auth.users AS auth_user
WHERE auth_user.raw_user_meta_data->>'role' = 'employer'
  AND NOT EXISTS (
    SELECT 1
    FROM public.employer AS profile
    WHERE profile.user_id = auth_user.id
       OR (
         auth_user.email IS NOT NULL
         AND lower(profile.email) = lower(auth_user.email)
       )
  )
ON CONFLICT (user_id) DO NOTHING;
