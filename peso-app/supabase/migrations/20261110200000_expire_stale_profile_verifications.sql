ALTER TABLE public.job_seeker
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_details_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_refresh_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.employer
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_details_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_refresh_required boolean NOT NULL DEFAULT false;

UPDATE public.job_seeker
SET last_verified_at = now()
WHERE verification_status = 'verified'
  AND last_verified_at IS NULL;

UPDATE public.employer
SET last_verified_at = now()
WHERE verification_status = 'verified'
  AND COALESCE(is_peso, false) = false
  AND last_verified_at IS NULL;

CREATE OR REPLACE FUNCTION public.track_profile_verification_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged :=
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE(public.is_staff_or_admin(), false);

  IF is_privileged
     AND NEW.verification_status = 'verified'
     AND OLD.verification_refresh_required THEN
    RAISE EXCEPTION
      'The account must resubmit its updated screening details before verification.';
  END IF;

  IF NOT is_privileged THEN
    NEW.verification_status := OLD.verification_status;
    NEW.last_verified_at := OLD.last_verified_at;
    NEW.verification_refresh_required := OLD.verification_refresh_required;
    IF TG_TABLE_NAME = 'employer' THEN
      NEW.is_verified := OLD.is_verified;
    END IF;

    IF OLD.verification_refresh_required
       AND NEW.verification_details_reviewed_at
           IS DISTINCT FROM OLD.verification_details_reviewed_at
       AND NEW.user_id = auth.uid() THEN
      NEW.verification_refresh_required := false;
    END IF;
  ELSIF NEW.verification_status = 'verified'
        AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
    NEW.last_verified_at := now();
    NEW.verification_refresh_required := false;
  END IF;

  IF TG_TABLE_NAME = 'employer' AND is_privileged THEN
    NEW.is_verified := NEW.verification_status = 'verified';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_job_seeker_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND COALESCE(public.is_staff_or_admin(), false) IS NOT TRUE THEN
    NEW.verification_status := OLD.verification_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_job_seeker_verification_refresh
  ON public.job_seeker;
CREATE TRIGGER trg_track_job_seeker_verification_refresh
BEFORE UPDATE OF verification_status, registration_details, verification_details_reviewed_at, verification_refresh_required, last_verified_at
ON public.job_seeker
FOR EACH ROW
EXECUTE FUNCTION public.track_profile_verification_refresh();

DROP TRIGGER IF EXISTS trg_track_employer_verification_refresh
  ON public.employer;
CREATE TRIGGER trg_track_employer_verification_refresh
BEFORE UPDATE OF verification_status, registration_details, verification_details_reviewed_at, verification_refresh_required, last_verified_at, is_verified
ON public.employer
FOR EACH ROW
EXECUTE FUNCTION public.track_profile_verification_refresh();

CREATE OR REPLACE FUNCTION public.expire_stale_profile_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.job_seeker
  SET
    verification_status = 'pending',
    verification_refresh_required = true
  WHERE verification_status = 'verified'
    AND last_verified_at <= now() - interval '6 months';

  UPDATE public.employer
  SET
    verification_status = 'pending',
    is_verified = false,
    verification_refresh_required = true
  WHERE verification_status = 'verified'
    AND COALESCE(is_peso, false) = false
    AND last_verified_at <= now() - interval '6 months';
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_profile_verifications()
  FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'peso-expire-stale-profile-verifications'
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'peso-expire-stale-profile-verifications',
    '0 0 * * *',
    'SELECT public.expire_stale_profile_verifications();'
  );
END;
$$;
