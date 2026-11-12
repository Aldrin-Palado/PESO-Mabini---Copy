CREATE OR REPLACE FUNCTION public.notify_applicant_on_final_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  applicant_user_id uuid;
  employer_user_id uuid;
  message_sender_id uuid := auth.uid();
  message_body text;
  job_title text;
BEGIN
  IF NEW.status NOT IN (
    'hired'::public.application_status,
    'rejected'::public.application_status
  ) THEN
    RETURN NEW;
  END IF;

  SELECT seeker.user_id, employer.user_id
  INTO applicant_user_id, employer_user_id
  FROM public.job_seeker AS seeker
  LEFT JOIN public.employer AS employer
    ON employer.employer_id = NEW.employer_id
  WHERE seeker.job_seeker_id = NEW.job_seeker_id;

  IF applicant_user_id IS NULL THEN
    RAISE EXCEPTION 'The applicant account could not be found; no status message was sent.';
  END IF;

  message_sender_id := COALESCE(message_sender_id, employer_user_id);
  IF message_sender_id IS NULL THEN
    RAISE EXCEPTION 'The sender account could not be identified; no status message was sent.';
  END IF;

  job_title := COALESCE(NULLIF(btrim(NEW.position_title), ''), 'the position');
  IF NEW.status = 'hired'::public.application_status THEN
    message_body := format(
      'Congratulations! Your application for %s has been updated to Hired. The employer will contact you about next steps.',
      job_title
    );
  ELSE
    message_body := format(
      'Thank you for your interest. Your application for %s has been updated to Rejected. We appreciate your time and wish you success in your job search.',
      job_title
    );
  END IF;

  INSERT INTO public.peso_messages (
    sender_user_id,
    recipient_user_id,
    body
  )
  VALUES (
    message_sender_id,
    applicant_user_id,
    message_body
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_applicant_on_final_application_status()
  FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS notify_applicant_on_final_application_status
ON public.application;

CREATE TRIGGER notify_applicant_on_final_application_status
  AFTER UPDATE OF status ON public.application
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status IN (
      'hired'::public.application_status,
      'rejected'::public.application_status
    )
  )
  EXECUTE FUNCTION public.notify_applicant_on_final_application_status();

CREATE OR REPLACE FUNCTION public.admin_decide_application(
  p_application_id uuid,
  p_approved boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  acting_user_id uuid := auth.uid();
  applicant_user_id uuid;
  current_status public.application_status;
  next_status public.application_status;
BEGIN
  IF acting_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an active Admin can decide applications.'
      USING ERRCODE = '42501';
  END IF;

  IF p_approved IS NULL THEN
    RAISE EXCEPTION 'An approval decision is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT application.status, seeker.user_id
  INTO current_status, applicant_user_id
  FROM public.application AS application
  JOIN public.job_seeker AS seeker
    ON seeker.job_seeker_id = application.job_seeker_id
  WHERE application.application_id = p_application_id
  FOR UPDATE OF application;

  IF NOT FOUND OR applicant_user_id IS NULL THEN
    RAISE EXCEPTION 'Application or applicant account was not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_status = 'withdrawn'::public.application_status THEN
    RAISE EXCEPTION 'A withdrawn application cannot be approved or rejected.'
      USING ERRCODE = '22023';
  END IF;

  IF current_status IN (
    'hired'::public.application_status,
    'rejected'::public.application_status
  ) THEN
    IF (current_status = 'hired'::public.application_status AND NOT p_approved)
      OR (current_status = 'rejected'::public.application_status AND p_approved) THEN
      RAISE EXCEPTION 'A final application decision cannot be reversed.'
        USING ERRCODE = '22023';
    END IF;

    RETURN jsonb_build_object(
      'status', current_status,
      'message_sent', false
    );
  END IF;

  next_status := CASE
    WHEN p_approved THEN 'hired'::public.application_status
    ELSE 'rejected'::public.application_status
  END;

  UPDATE public.application
  SET status = next_status,
      updated_at = now()
  WHERE application_id = p_application_id;

  RETURN jsonb_build_object(
    'status', next_status,
    'message_sent', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_decide_application(uuid, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decide_application(uuid, boolean)
  TO authenticated;
