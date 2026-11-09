CREATE OR REPLACE FUNCTION public.get_peso_admin_inbox_messages(
  candidate_contact_id uuid
)
RETURNS TABLE (
  message_id uuid,
  employer_id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  body text,
  created_at timestamptz,
  read_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  admin_user_id := public.get_peso_admin_inbox_user();

  IF candidate_contact_id IS NULL
    OR candidate_contact_id = admin_user_id
    OR NOT public.is_peso_message_user(candidate_contact_id)
  THEN
    RAISE EXCEPTION 'The conversation is not available in the Admin inbox.';
  END IF;

  RETURN QUERY
  SELECT
    message.message_id,
    message.employer_id,
    message.sender_user_id,
    message.recipient_user_id,
    message.body,
    message.created_at,
    message.read_at
  FROM public.peso_messages AS message
  WHERE (
    message.sender_user_id = admin_user_id
    AND message.recipient_user_id = candidate_contact_id
  )
  OR (
    message.sender_user_id = candidate_contact_id
    AND message.recipient_user_id = admin_user_id
  )
  ORDER BY message.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peso_admin_inbox_messages(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_peso_admin_inbox_messages(uuid)
  TO authenticated;
