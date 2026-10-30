CREATE TABLE public.peso_messages (
  message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES public.employer(employer_id) ON DELETE SET NULL,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (
    length(trim(body)) BETWEEN 1 AND 5000
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT peso_messages_distinct_participants
    CHECK (sender_user_id <> recipient_user_id)
);

ALTER TABLE public.peso_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX peso_messages_participants_created_idx
  ON public.peso_messages (sender_user_id, recipient_user_id, created_at);

CREATE INDEX peso_messages_recipient_unread_idx
  ON public.peso_messages (recipient_user_id, read_at)
  WHERE read_at IS NULL;

REVOKE ALL ON TABLE public.peso_messages FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.peso_messages TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.peso_messages TO authenticated;
GRANT ALL ON TABLE public.peso_messages TO service_role;

CREATE POLICY "Participants can read their messages"
  ON public.peso_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_user_id = (SELECT auth.uid())
    OR recipient_user_id = (SELECT auth.uid())
  );

CREATE POLICY "Recipients can mark messages as read"
  ON public.peso_messages
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    recipient_user_id = (SELECT auth.uid())
  );

CREATE OR REPLACE FUNCTION public.is_peso_message_user(candidate_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.peso_admin
      WHERE user_id = candidate_user_id AND is_active
    )
    OR EXISTS (
      SELECT 1 FROM public.peso_staff
      WHERE user_id = candidate_user_id AND is_active
    )
    OR EXISTS (
      SELECT 1 FROM public.employer
      WHERE user_id = candidate_user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE user_id = candidate_user_id
    );
$$;

CREATE POLICY "Registered PESO users can message each other"
  ON public.peso_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = (SELECT auth.uid())
    AND public.is_peso_message_user(sender_user_id)
    AND public.is_peso_message_user(recipient_user_id)
  );

CREATE OR REPLACE FUNCTION public.get_peso_message_contacts()
RETURNS TABLE (user_id uuid, display_name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT contacts.user_id, contacts.display_name, contacts.role
  FROM (
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
  ) AS contacts
  WHERE contacts.user_id <> (SELECT auth.uid())
    AND public.is_peso_message_user((SELECT auth.uid()))
  ORDER BY contacts.display_name;
$$;

REVOKE ALL ON FUNCTION public.is_peso_message_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_peso_message_user(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_peso_message_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_peso_message_contacts() TO authenticated;
