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
    AND last_verified_at <= now() - interval '1 year';

  UPDATE public.employer
  SET
    verification_status = 'pending',
    is_verified = false,
    verification_refresh_required = true
  WHERE verification_status = 'verified'
    AND COALESCE(is_peso, false) = false
    AND last_verified_at <= now() - interval '1 year';
END;
$$;
