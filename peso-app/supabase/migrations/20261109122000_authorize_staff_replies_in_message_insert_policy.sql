DROP POLICY IF EXISTS "Authorized staff can reply in the Admin inbox"
  ON public.peso_messages;

CREATE OR REPLACE FUNCTION public.can_send_peso_message(
  candidate_sender_id uuid,
  candidate_recipient_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    candidate_sender_id <> candidate_recipient_id
    AND public.is_peso_message_user(candidate_sender_id)
    AND public.is_peso_message_user(candidate_recipient_id)
    AND (
      (
        candidate_sender_id = (SELECT auth.uid())
        AND NOT EXISTS (
          SELECT 1
          FROM public.peso_staff AS staff
          WHERE staff.user_id = candidate_sender_id
        )
        AND NOT (
          (
            EXISTS (
              SELECT 1
              FROM public.job_seeker AS sender_seeker
              WHERE sender_seeker.user_id = candidate_sender_id
            )
            AND EXISTS (
              SELECT 1
              FROM public.job_seeker AS recipient_seeker
              WHERE recipient_seeker.user_id = candidate_recipient_id
            )
          )
          OR (
            EXISTS (
              SELECT 1
              FROM public.employer AS sender_employer
              WHERE sender_employer.user_id = candidate_sender_id
            )
            AND EXISTS (
              SELECT 1
              FROM public.employer AS recipient_employer
              WHERE recipient_employer.user_id = candidate_recipient_id
            )
          )
        )
      )
      OR (
        public.can_access_peso_admin_inbox(candidate_sender_id)
        AND EXISTS (
          SELECT 1
          FROM public.peso_messages AS existing_message
          WHERE (
            existing_message.sender_user_id = candidate_sender_id
            AND existing_message.recipient_user_id = candidate_recipient_id
          )
          OR (
            existing_message.sender_user_id = candidate_recipient_id
            AND existing_message.recipient_user_id = candidate_sender_id
          )
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_send_peso_message(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_peso_message(uuid, uuid)
  TO authenticated;
