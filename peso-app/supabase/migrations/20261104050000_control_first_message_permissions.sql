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
    AND public.is_peso_message_user(candidate_sender_id)
    AND public.is_peso_message_user(candidate_recipient_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.peso_admin
        WHERE user_id = candidate_sender_id AND is_active
      )
      OR EXISTS (
        SELECT 1
        FROM public.peso_staff
        WHERE user_id = candidate_sender_id AND is_active
      )
      OR EXISTS (
        SELECT 1
        FROM public.employer
        WHERE user_id = candidate_sender_id
      )
      OR (
        EXISTS (
          SELECT 1
          FROM public.job_seeker
          WHERE user_id = candidate_sender_id
        )
        AND EXISTS (
          SELECT 1
          FROM public.peso_messages
          WHERE sender_user_id = candidate_recipient_id
            AND recipient_user_id = candidate_sender_id
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_send_peso_message(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_peso_message(uuid, uuid)
  TO authenticated;

DROP POLICY IF EXISTS "Registered PESO users can message each other"
  ON public.peso_messages;

CREATE POLICY "Registered PESO users can message each other"
  ON public.peso_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_send_peso_message(sender_user_id, recipient_user_id)
  );

CREATE OR REPLACE FUNCTION public.get_peso_message_contact_by_email(
  candidate_email text
)
RETURNS TABLE (user_id uuid, display_name text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1
      FROM public.peso_admin
      WHERE user_id = (SELECT auth.uid()) AND is_active
    )
    OR EXISTS (
      SELECT 1
      FROM public.employer
      WHERE user_id = (SELECT auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'Only admins and employers can start conversations by email.';
  END IF;

  RETURN QUERY
  WITH contacts AS (
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
  SELECT contacts.user_id, contacts.display_name, contacts.role
  FROM contacts
  JOIN auth.users AS users ON users.id = contacts.user_id
  WHERE contacts.user_id <> (SELECT auth.uid())
    AND users.email_confirmed_at IS NOT NULL
    AND lower(btrim(users.email)) = lower(btrim(candidate_email))
    AND public.is_peso_message_user(contacts.user_id)
  ORDER BY CASE contacts.role
    WHEN 'Admin' THEN 1
    WHEN 'Staff' THEN 2
    WHEN 'Employer' THEN 3
    ELSE 4
  END
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peso_message_contact_by_email(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_peso_message_contact_by_email(text)
  TO authenticated;
