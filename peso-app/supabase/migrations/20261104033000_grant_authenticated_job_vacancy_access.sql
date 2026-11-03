REVOKE ALL ON FUNCTION public.get_open_job_vacancies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_open_job_vacancies() TO authenticated;
