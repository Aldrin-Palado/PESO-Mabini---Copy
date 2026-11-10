ALTER TABLE public.job_vacancy
  ADD COLUMN IF NOT EXISTS posted_by_user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.job_vacancy
  ALTER COLUMN posted_by_user_id SET DEFAULT auth.uid();

UPDATE public.job_vacancy AS job
SET posted_by_user_id = employer.user_id
FROM public.employer AS employer
WHERE employer.employer_id = job.employer_id
  AND employer.is_peso IS NOT TRUE
  AND job.posted_by_user_id IS NULL
  AND employer.user_id IS NOT NULL;

WITH job_post_authors AS (
  SELECT
    log.details ->> 'record_id' AS job_vacancy_id,
    admin.user_id
  FROM public.admin_activity_log AS log
  JOIN public.peso_admin AS admin
    ON admin.admin_id = log.admin_id
  WHERE log.action = 'Created Job Posts'
    AND log.details ->> 'operation' = 'INSERT'
    AND log.details ->> 'area' = 'Job Posts'
    AND log.peso_staff_id IS NULL

  UNION ALL

  SELECT
    log.details ->> 'record_id' AS job_vacancy_id,
    staff.user_id
  FROM public.admin_activity_log AS log
  JOIN public.peso_staff AS staff
    ON staff.peso_staff_id = log.peso_staff_id
  WHERE log.action = 'Created Job Posts'
    AND log.details ->> 'operation' = 'INSERT'
    AND log.details ->> 'area' = 'Job Posts'
)
UPDATE public.job_vacancy AS job
SET posted_by_user_id = authors.user_id
FROM job_post_authors AS authors
WHERE job.job_vacancy_id::text = authors.job_vacancy_id
  AND job.posted_by_user_id IS NULL
  AND authors.user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_job_post_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.posted_by_user_id := auth.uid();
    ELSE
      NEW.posted_by_user_id := OLD.posted_by_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_job_post_author
ON public.job_vacancy;

CREATE TRIGGER set_job_post_author
BEFORE INSERT OR UPDATE ON public.job_vacancy
FOR EACH ROW
EXECUTE FUNCTION public.set_job_post_author();

ALTER TABLE public.application
  ADD COLUMN IF NOT EXISTS job_vacancy_id uuid
    REFERENCES public.job_vacancy(job_vacancy_id) ON DELETE SET NULL;

UPDATE public.application AS application_record
SET job_vacancy_id = (
  SELECT job.job_vacancy_id
  FROM public.job_vacancy AS job
  WHERE job.employer_id = application_record.employer_id
    AND job.position_title = application_record.position_title
    AND job.date_posted <= application_record.date_applied
  ORDER BY job.date_posted DESC
  LIMIT 1
)
WHERE application_record.job_vacancy_id IS NULL;

CREATE OR REPLACE FUNCTION public.authorize_application_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  matching_job_exists boolean;
  job_was_posted_by_actor boolean;
  actor_is_application_staff boolean;
  actor_owns_employer boolean;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION
      'Application status can only be changed by an authorized signed-in user.'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.job_vacancy AS job
    WHERE job.employer_id = OLD.employer_id
      AND (
        job.job_vacancy_id = OLD.job_vacancy_id
        OR (
          OLD.job_vacancy_id IS NULL
          AND job.position_title = OLD.position_title
        )
      )
  )
  INTO matching_job_exists;

  SELECT EXISTS (
    SELECT 1
    FROM public.job_vacancy AS job
    WHERE job.employer_id = OLD.employer_id
      AND (
        job.job_vacancy_id = OLD.job_vacancy_id
        OR (
          OLD.job_vacancy_id IS NULL
          AND job.position_title = OLD.position_title
        )
      )
      AND job.posted_by_user_id = auth.uid()
  )
  INTO job_was_posted_by_actor;

  SELECT EXISTS (
    SELECT 1
    FROM public.peso_staff AS staff
    JOIN public.staff_permissions AS permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    WHERE staff.user_id = auth.uid()
      AND staff.is_active
      AND permissions.job_application
  )
  INTO actor_is_application_staff;

  SELECT EXISTS (
    SELECT 1
    FROM public.employer AS employer_profile
    WHERE employer_profile.employer_id = OLD.employer_id
      AND employer_profile.user_id = auth.uid()
  )
  INTO actor_owns_employer;

  IF matching_job_exists
    AND (
      actor_owns_employer
      OR (
        job_was_posted_by_actor
        AND (
          public.is_admin()
          OR actor_is_application_staff
        )
      )
    )
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Only the employer for this application, or the PESO admin/staff member who posted the job, can change its status.'
    USING ERRCODE = '42501';
END;
$$;
