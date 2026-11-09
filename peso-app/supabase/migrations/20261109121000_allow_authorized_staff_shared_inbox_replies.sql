DROP POLICY IF EXISTS "Authorized staff can reply in the Admin inbox"
  ON public.peso_messages;

CREATE POLICY "Authorized staff can reply in the Admin inbox"
  ON public.peso_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_peso_admin_inbox(sender_user_id)
    AND public.is_peso_message_user(recipient_user_id)
    AND EXISTS (
      SELECT 1
      FROM public.peso_messages AS existing_message
      WHERE (
        existing_message.sender_user_id = sender_user_id
        AND existing_message.recipient_user_id = recipient_user_id
      )
      OR (
        existing_message.sender_user_id = recipient_user_id
        AND existing_message.recipient_user_id = sender_user_id
      )
    )
  );
