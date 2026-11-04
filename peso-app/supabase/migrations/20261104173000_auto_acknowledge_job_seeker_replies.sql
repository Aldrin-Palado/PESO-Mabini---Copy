CREATE OR REPLACE FUNCTION public.auto_acknowledge_job_seeker_admin_replies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  previous_message public.peso_messages%ROWTYPE;
  acknowledgment constant text := E'Dear Job Seeker,\n\nThank you for contacting PESO-Hub. We have received your message and appreciate your interest.\n\nOur team will review your inquiry and respond as soon as possible. Thank you for your patience.\n\nBest regards,\nPESO Mabini Team\nPublic Employment Service Office\nMunicipality of Mabini, Batangas';
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.job_seeker
    WHERE user_id = NEW.sender_user_id
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.peso_admin
    WHERE user_id = NEW.recipient_user_id
      AND is_active
  ) THEN
    RETURN NEW;
  END IF;

  SELECT message.*
  INTO previous_message
  FROM public.peso_messages AS message
  WHERE message.message_id <> NEW.message_id
    AND (
      (
        message.sender_user_id = NEW.sender_user_id
        AND message.recipient_user_id = NEW.recipient_user_id
      )
      OR (
        message.sender_user_id = NEW.recipient_user_id
        AND message.recipient_user_id = NEW.sender_user_id
      )
    )
  ORDER BY message.created_at DESC, message.message_id DESC
  LIMIT 1;

  IF NOT FOUND
    OR previous_message.sender_user_id <> NEW.recipient_user_id
    OR previous_message.body = acknowledgment
  THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.peso_messages (
    employer_id,
    sender_user_id,
    recipient_user_id,
    body
  )
  VALUES (
    NULL,
    NEW.recipient_user_id,
    NEW.sender_user_id,
    acknowledgment
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_acknowledge_job_seeker_admin_replies()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS auto_acknowledge_job_seeker_admin_replies
  ON public.peso_messages;

CREATE TRIGGER auto_acknowledge_job_seeker_admin_replies
  AFTER INSERT ON public.peso_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_acknowledge_job_seeker_admin_replies();
