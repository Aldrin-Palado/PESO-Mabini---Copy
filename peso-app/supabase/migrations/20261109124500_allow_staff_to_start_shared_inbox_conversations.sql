CREATE OR REPLACE FUNCTION public.send_peso_admin_inbox_reply(
  candidate_recipient_id uuid,
  candidate_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id uuid;
  inserted_message_id uuid;
BEGIN
  admin_user_id := public.get_peso_admin_inbox_user();

  IF candidate_recipient_id IS NULL
    OR candidate_recipient_id = admin_user_id
    OR NOT public.is_peso_message_user(candidate_recipient_id)
  THEN
    RAISE EXCEPTION 'The recipient is not a registered PESO account.';
  END IF;

  IF candidate_body IS NULL
    OR length(btrim(candidate_body)) NOT BETWEEN 1 AND 5000
  THEN
    RAISE EXCEPTION 'Message must contain between 1 and 5000 characters.';
  END IF;

  INSERT INTO public.peso_messages (
    employer_id,
    sender_user_id,
    recipient_user_id,
    body
  )
  VALUES (
    NULL,
    admin_user_id,
    candidate_recipient_id,
    btrim(candidate_body)
  )
  RETURNING message_id INTO inserted_message_id;

  RETURN inserted_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_peso_admin_inbox_reply(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_peso_admin_inbox_reply(uuid, text)
  TO authenticated;
