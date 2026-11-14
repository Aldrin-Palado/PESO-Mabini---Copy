CREATE OR REPLACE FUNCTION public.notify_job_seeker_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION
      'The job seeker account has no user ID; verification notification was not sent.';
  END IF;

  SELECT admin.user_id
  INTO admin_user_id
  FROM public.peso_admin AS admin
  WHERE admin.is_active
    AND admin.user_id IS NOT NULL
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION
      'No active PESO Admin account is available to send the verification notification.';
  END IF;

  INSERT INTO public.peso_messages (
    sender_user_id,
    recipient_user_id,
    author_user_id,
    body
  )
  VALUES (
    admin_user_id,
    NEW.user_id,
    NULL,
    'Your PESO Mabini job seeker account has been verified. You may now apply for jobs through the PESO Mabini portal.'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_job_seeker_on_verification()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_job_seeker_on_verification
  ON public.job_seeker;
CREATE TRIGGER notify_job_seeker_on_verification
  AFTER UPDATE OF verification_status ON public.job_seeker
  FOR EACH ROW
  WHEN (
    OLD.verification_status IS DISTINCT FROM NEW.verification_status
    AND NEW.verification_status = 'verified'
  )
  EXECUTE FUNCTION public.notify_job_seeker_on_verification();
