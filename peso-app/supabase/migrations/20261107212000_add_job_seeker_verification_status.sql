ALTER TABLE public.job_seeker
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.job_seeker
  DROP CONSTRAINT IF EXISTS job_seeker_verification_status_check;

ALTER TABLE public.job_seeker
  ADD CONSTRAINT job_seeker_verification_status_check
  CHECK (verification_status IN ('pending', 'verified', 'not_approved'));

CREATE OR REPLACE FUNCTION public.protect_job_seeker_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(public.is_staff_or_admin(), false) IS NOT TRUE THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verification_status := 'pending';
    ELSE
      NEW.verification_status := OLD.verification_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_job_seeker_verification_status
  ON public.job_seeker;
CREATE TRIGGER trg_protect_job_seeker_verification_status
BEFORE INSERT OR UPDATE OF verification_status ON public.job_seeker
FOR EACH ROW
EXECUTE FUNCTION public.protect_job_seeker_verification_status();
