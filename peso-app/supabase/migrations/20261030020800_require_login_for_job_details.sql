CREATE OR REPLACE FUNCTION public.get_public_job_vacancy_previews()
RETURNS TABLE (
  job_vacancy_id uuid,
  position_title text,
  employer_name text,
  job_classification text
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
    job.job_classification
  FROM public.job_vacancy AS job
  JOIN public.employer AS employer
    ON employer.employer_id = job.employer_id
  WHERE job.status = 'open';
$$;

REVOKE ALL ON FUNCTION public.get_public_job_vacancy_previews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_job_vacancy_previews() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_open_job_vacancies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_open_job_vacancies() TO authenticated;
