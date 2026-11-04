CREATE OR REPLACE FUNCTION public.auto_acknowledge_job_seeker_admin_replies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  latest_admin_message public.peso_messages%ROWTYPE;
  latest_job_seeker_message public.peso_messages%ROWTYPE;
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
  INTO latest_admin_message
  FROM public.peso_messages AS message
  WHERE message.sender_user_id = NEW.recipient_user_id
    AND message.recipient_user_id = NEW.sender_user_id
    AND message.message_id <> NEW.message_id
  ORDER BY message.created_at DESC, message.message_id DESC
  LIMIT 1;

  IF NOT FOUND OR latest_admin_message.body = acknowledgment THEN
    RETURN NEW;
  END IF;

  SELECT message.*
  INTO latest_job_seeker_message
  FROM public.peso_messages AS message
  WHERE message.sender_user_id = NEW.sender_user_id
    AND message.recipient_user_id = NEW.recipient_user_id
    AND message.message_id <> NEW.message_id
  ORDER BY message.created_at DESC, message.message_id DESC
  LIMIT 1;

  IF FOUND AND (
    latest_job_seeker_message.created_at > latest_admin_message.created_at
    OR (
      latest_job_seeker_message.created_at = latest_admin_message.created_at
      AND latest_job_seeker_message.message_id > latest_admin_message.message_id
    )
  ) THEN
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

WITH latest_replies AS (
  SELECT DISTINCT ON (
    message.sender_user_id,
    message.recipient_user_id
  )
    message.sender_user_id AS seeker_user_id,
    message.recipient_user_id AS admin_user_id,
    message.created_at AS reply_created_at,
    message.message_id AS reply_message_id
  FROM public.peso_messages AS message
  JOIN public.job_seeker AS seeker
    ON seeker.user_id = message.sender_user_id
  JOIN public.peso_admin AS admin_profile
    ON admin_profile.user_id = message.recipient_user_id
   AND admin_profile.is_active
  WHERE message.created_at >= TIMESTAMPTZ '2026-11-04 09:30:00+00'
  ORDER BY
    message.sender_user_id,
    message.recipient_user_id,
    message.created_at DESC,
    message.message_id DESC
),
pending_replies AS (
  SELECT
    latest_replies.seeker_user_id,
    latest_replies.admin_user_id
  FROM latest_replies
  JOIN LATERAL (
    SELECT
      message.message_id,
      message.created_at,
      message.body
    FROM public.peso_messages AS message
    WHERE message.sender_user_id = latest_replies.admin_user_id
      AND message.recipient_user_id = latest_replies.seeker_user_id
    ORDER BY message.created_at DESC, message.message_id DESC
    LIMIT 1
  ) AS latest_admin_message ON true
  WHERE latest_admin_message.body <> E'Dear Job Seeker,\n\nThank you for contacting PESO-Hub. We have received your message and appreciate your interest.\n\nOur team will review your inquiry and respond as soon as possible. Thank you for your patience.\n\nBest regards,\nPESO Mabini Team\nPublic Employment Service Office\nMunicipality of Mabini, Batangas'
    AND (
      latest_replies.reply_created_at > latest_admin_message.created_at
      OR (
        latest_replies.reply_created_at = latest_admin_message.created_at
        AND latest_replies.reply_message_id > latest_admin_message.message_id
      )
    )
)
INSERT INTO public.peso_messages (
  employer_id,
  sender_user_id,
  recipient_user_id,
  body
)
SELECT
  NULL,
  pending_replies.admin_user_id,
  pending_replies.seeker_user_id,
  E'Dear Job Seeker,\n\nThank you for contacting PESO-Hub. We have received your message and appreciate your interest.\n\nOur team will review your inquiry and respond as soon as possible. Thank you for your patience.\n\nBest regards,\nPESO Mabini Team\nPublic Employment Service Office\nMunicipality of Mabini, Batangas'
FROM pending_replies;
