ALTER TABLE public.job_vacancy
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE OR REPLACE FUNCTION public.get_open_job_vacancies()
RETURNS TABLE (
  job_vacancy_id uuid,
  position_title text,
  description text,
  requirements text,
  location text,
  employment_type text,
  salary_min numeric,
  salary_max numeric,
  vacancies_available integer,
  date_posted timestamptz,
  deadline date,
  image_url text,
  employer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    job.job_vacancy_id,
    job.position_title,
    job.description,
    job.requirements,
    job.location,
    job.employment_type,
    job.salary_min,
    job.salary_max,
    job.vacancies_available,
    job.date_posted,
    job.deadline,
    job.image_url,
    employer.name AS employer_name
  FROM public.job_vacancy AS job
  JOIN public.employer AS employer
    ON employer.employer_id = job.employer_id
  WHERE job.status = 'open';
$$;

REVOKE ALL ON FUNCTION public.get_open_job_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_open_job_vacancies() TO anon, authenticated;
