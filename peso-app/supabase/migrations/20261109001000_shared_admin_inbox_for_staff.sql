ALTER TABLE public.staff_permissions
  ADD COLUMN IF NOT EXISTS messages boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.can_access_peso_admin_inbox(
  candidate_admin_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.peso_staff AS staff
    JOIN public.staff_permissions AS permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    JOIN public.peso_admin AS admin_profile
      ON admin_profile.admin_id = staff.admin_id
    WHERE staff.user_id = (SELECT auth.uid())
      AND staff.is_active
      AND permissions.messages
      AND admin_profile.is_active
      AND admin_profile.user_id = candidate_admin_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_peso_admin_inbox(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_peso_admin_inbox(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_peso_admin_inbox_user()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT admin_profile.user_id
  INTO admin_user_id
  FROM public.peso_staff AS staff
  JOIN public.staff_permissions AS permissions
    ON permissions.peso_staff_id = staff.peso_staff_id
  JOIN public.peso_admin AS admin_profile
    ON admin_profile.admin_id = staff.admin_id
  WHERE staff.user_id = (SELECT auth.uid())
    AND staff.is_active
    AND permissions.messages
    AND admin_profile.is_active
    AND admin_profile.user_id IS NOT NULL;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'You do not have permission to access the shared Admin inbox.';
  END IF;

  RETURN admin_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peso_admin_inbox_user()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_peso_admin_inbox_user()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_peso_admin_inbox_contacts()
RETURNS TABLE (user_id uuid, display_name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH inbox_owner AS (
    SELECT public.get_peso_admin_inbox_user() AS user_id
  ),
  registered_contacts AS (
    SELECT admin_profile.user_id, admin_profile.full_name AS display_name, 'Admin'::text AS role
    FROM public.peso_admin AS admin_profile
    WHERE admin_profile.is_active AND admin_profile.user_id IS NOT NULL
    UNION ALL
    SELECT staff_profile.user_id, staff_profile.full_name, 'Staff'::text
    FROM public.peso_staff AS staff_profile
    WHERE staff_profile.is_active AND staff_profile.user_id IS NOT NULL
    UNION ALL
    SELECT employer_profile.user_id, employer_profile.name, 'Employer'::text
    FROM public.employer AS employer_profile
    WHERE employer_profile.user_id IS NOT NULL
    UNION ALL
    SELECT seeker_profile.user_id, seeker_profile.full_name, 'Job Seeker'::text
    FROM public.job_seeker AS seeker_profile
    WHERE seeker_profile.user_id IS NOT NULL
  )
  SELECT DISTINCT
    contact.user_id,
    contact.display_name,
    contact.role
  FROM registered_contacts AS contact
  CROSS JOIN inbox_owner AS owner
  JOIN public.peso_messages AS message
    ON (
      message.sender_user_id = owner.user_id
      AND message.recipient_user_id = contact.user_id
    )
    OR (
      message.sender_user_id = contact.user_id
      AND message.recipient_user_id = owner.user_id
    )
  WHERE contact.user_id <> owner.user_id
  ORDER BY contact.display_name;
$$;

REVOKE ALL ON FUNCTION public.get_peso_admin_inbox_contacts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_peso_admin_inbox_contacts()
  TO authenticated;

DROP POLICY IF EXISTS "Participants can read their messages"
  ON public.peso_messages;
CREATE POLICY "Participants and authorized staff can read messages"
  ON public.peso_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_user_id = (SELECT auth.uid())
    OR recipient_user_id = (SELECT auth.uid())
    OR public.can_access_peso_admin_inbox(sender_user_id)
    OR public.can_access_peso_admin_inbox(recipient_user_id)
  );

DROP POLICY IF EXISTS "Recipients can mark messages as read"
  ON public.peso_messages;
CREATE POLICY "Recipients and authorized staff can mark messages as read"
  ON public.peso_messages
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid())
    OR public.can_access_peso_admin_inbox(recipient_user_id)
  )
  WITH CHECK (
    recipient_user_id = (SELECT auth.uid())
    OR public.can_access_peso_admin_inbox(recipient_user_id)
  );

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

  IF NOT EXISTS (
    SELECT 1
    FROM public.peso_messages AS message
    WHERE (
      message.sender_user_id = admin_user_id
      AND message.recipient_user_id = candidate_recipient_id
    )
    OR (
      message.sender_user_id = candidate_recipient_id
      AND message.recipient_user_id = admin_user_id
    )
  ) THEN
    RAISE EXCEPTION 'There is no Admin inbox conversation with this account.';
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
    candidate_sender_id = (SELECT auth.uid())
    AND candidate_sender_id <> candidate_recipient_id
    AND public.is_peso_message_user(candidate_sender_id)
    AND public.is_peso_message_user(candidate_recipient_id)
    AND NOT EXISTS (
      SELECT 1
      FROM public.peso_staff
      WHERE user_id = candidate_sender_id
    )
    AND NOT (
      (
        EXISTS (
          SELECT 1
          FROM public.job_seeker
          WHERE user_id = candidate_sender_id
        )
        AND EXISTS (
          SELECT 1
          FROM public.job_seeker
          WHERE user_id = candidate_recipient_id
        )
      )
      OR (
        EXISTS (
          SELECT 1
          FROM public.employer
          WHERE user_id = candidate_sender_id
        )
        AND EXISTS (
          SELECT 1
          FROM public.employer
          WHERE user_id = candidate_recipient_id
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_send_peso_message(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_peso_message(uuid, uuid)
  TO authenticated;
