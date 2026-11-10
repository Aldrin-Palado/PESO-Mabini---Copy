CREATE OR REPLACE FUNCTION public.authorize_application_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.employer AS employer_profile
      WHERE employer_profile.employer_id = OLD.employer_id
        AND employer_profile.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.peso_staff AS staff
      JOIN public.staff_permissions AS permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = auth.uid()
        AND staff.is_active
        AND permissions.job_application
    )
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Only the employer for this application, a PESO admin, or assigned application staff can change its status.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS authorize_application_status_update
ON public.application;

CREATE TRIGGER authorize_application_status_update
BEFORE UPDATE OF status ON public.application
FOR EACH ROW
EXECUTE FUNCTION public.authorize_application_status_update();
