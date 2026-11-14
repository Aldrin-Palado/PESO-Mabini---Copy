ALTER TABLE public.peso_messages
  ADD COLUMN author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.peso_messages
SET author_user_id = sender_user_id
WHERE author_user_id IS NULL;

REVOKE INSERT ON public.peso_messages FROM authenticated;
REVOKE INSERT (
  employer_id,
  sender_user_id,
  recipient_user_id,
  body
) ON public.peso_messages FROM authenticated;
GRANT INSERT (
  employer_id,
  sender_user_id,
  recipient_user_id,
  body,
  author_user_id
) ON public.peso_messages TO authenticated;
GRANT DELETE ON public.peso_messages TO authenticated;

DROP POLICY IF EXISTS "Registered PESO users can message each other"
  ON public.peso_messages;
CREATE POLICY "Registered PESO users can message each other"
  ON public.peso_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (SELECT auth.uid())
    AND public.can_send_peso_message(sender_user_id, recipient_user_id)
  );

DROP POLICY IF EXISTS "Admins and authorized staff can delete their own messages"
  ON public.peso_messages;
CREATE POLICY "Admins and authorized staff can delete their own messages"
  ON public.peso_messages
  FOR DELETE
  TO authenticated
  USING (
    author_user_id = (SELECT auth.uid())
    AND (
      (
        public.is_admin()
        AND sender_user_id = (SELECT auth.uid())
      )
      OR public.can_access_peso_admin_inbox(sender_user_id)
    )
  );

DROP FUNCTION IF EXISTS public.get_peso_admin_inbox_messages(uuid);
CREATE FUNCTION public.get_peso_admin_inbox_messages(
  candidate_contact_id uuid
)
RETURNS TABLE (
  message_id uuid,
  employer_id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  author_user_id uuid,
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
    message.author_user_id,
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
    author_user_id,
    body
  )
  VALUES (
    NULL,
    admin_user_id,
    candidate_recipient_id,
    (SELECT auth.uid()),
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
