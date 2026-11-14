CREATE OR REPLACE FUNCTION public.get_my_application_employer_profiles()
RETURNS TABLE (
  application_id uuid,
  employer_name text,
  employer_logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    application.application_id,
    employer.name,
    employer.logo_url
  FROM public.application
  JOIN public.job_seeker
    ON job_seeker.job_seeker_id = application.job_seeker_id
  JOIN public.employer
    ON employer.employer_id = application.employer_id
  WHERE job_seeker.user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_application_employer_profiles()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_application_employer_profiles()
  TO authenticated;
