DROP FUNCTION IF EXISTS public.get_public_job_vacancy_previews();

CREATE FUNCTION public.get_public_job_vacancy_previews()
RETURNS TABLE (
  job_vacancy_id uuid,
  position_title text,
  employer_name text,
  job_classification text,
  employer_logo_url text,
  location text,
  employment_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    job.job_vacancy_id,
    job.position_title,
    employer.name AS employer_name,
    job.job_classification,
    employer.logo_url AS employer_logo_url,
    job.location,
    job.employment_type
  FROM public.job_vacancy AS job
  JOIN public.employer AS employer
    ON employer.employer_id = job.employer_id
  WHERE job.status = 'open';
$$;

REVOKE ALL ON FUNCTION public.get_public_job_vacancy_previews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_job_vacancy_previews() TO anon, authenticated;
