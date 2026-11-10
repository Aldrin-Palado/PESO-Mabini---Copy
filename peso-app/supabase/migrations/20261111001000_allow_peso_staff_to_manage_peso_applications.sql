CREATE OR REPLACE FUNCTION public.authorize_application_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  matching_job_exists boolean;
  matching_job_is_peso boolean;
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
    JOIN public.employer AS employer_profile
      ON employer_profile.employer_id = job.employer_id
    WHERE job.employer_id = OLD.employer_id
      AND (
        job.job_vacancy_id = OLD.job_vacancy_id
        OR (
          OLD.job_vacancy_id IS NULL
          AND job.position_title = OLD.position_title
        )
      )
      AND employer_profile.is_peso IS TRUE
  )
  INTO matching_job_is_peso;

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
        matching_job_is_peso
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
    'Employers can only update their own applicants. PESO admins and assigned application staff can only update applications for PESO job posts.'
    USING ERRCODE = '42501';
END;
$$;
