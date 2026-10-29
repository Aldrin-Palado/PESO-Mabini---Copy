SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
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
BEGIN
    user_role := NEW.raw_user_meta_data->>'role';
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', ''
    );
    user_company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name', ''
    );
    user_email := NEW.email;
    user_address := COALESCE(
        NEW.raw_user_meta_data->>'business_address', ''
    );
    user_contact_person := COALESCE(
        NEW.raw_user_meta_data->>'contact_person',
        user_full_name
    );
    user_contact_no := COALESCE(
        NEW.raw_user_meta_data->>'contact_no', ''
    );

    IF user_role = 'jobseeker' THEN
        INSERT INTO public.job_seeker (
            user_id,
            full_name,
            email,
            is_active
        )
        VALUES (
            NEW.id,
            user_full_name,
            user_email,
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
            email
        )
        VALUES (
            NEW.id,
            user_company_name,
            user_address,
            user_contact_person,
            user_contact_no,
            user_email
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$;

