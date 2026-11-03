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
  congratulations_message text := E'Congratulations! You Are Hired! 🎉\n\nDear Applicant,\n\nWe are pleased to inform you that you have been successfully hired for the position you applied for!\n\nAfter reviewing your application and qualifications, the company has decided to welcome you to the team.\n\nCongratulations on your new journey! We look forward to working with you and wish you success in your new role.\n\nBest regards,\nPESO Recruitment Team';
  rejection_message text := E'Dear Applicant,\n\nThank you for your interest in our company. We regret to inform you that your application was not selected. We appreciate your time and effort and wish you success in your future opportunities.\n\nBest regards,\nPESO Recruitment Team';
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

  INSERT INTO public.peso_messages (
    sender_user_id,
    recipient_user_id,
    body
  )
  VALUES (
    acting_user_id,
    applicant_user_id,
    CASE
      WHEN p_approved THEN congratulations_message
      ELSE rejection_message
    END
  );

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
