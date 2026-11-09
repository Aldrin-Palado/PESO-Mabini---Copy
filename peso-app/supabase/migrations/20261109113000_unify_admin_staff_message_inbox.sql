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
  FROM public.peso_admin AS admin_profile
  WHERE admin_profile.user_id = (SELECT auth.uid())
    AND admin_profile.is_active;

  IF admin_user_id IS NOT NULL THEN
    RETURN admin_user_id;
  END IF;

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
