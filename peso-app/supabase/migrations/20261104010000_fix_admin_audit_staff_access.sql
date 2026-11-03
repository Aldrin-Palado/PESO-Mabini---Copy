GRANT SELECT ON TABLE public.admin_activity_log TO authenticated;
GRANT SELECT ON TABLE public.peso_staff TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view admin activity logs"
  ON public.admin_activity_log;
CREATE POLICY "Authenticated users can view admin activity logs"
  ON public.admin_activity_log
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Authenticated admins can view staff accounts"
  ON public.peso_staff;
CREATE POLICY "Authenticated admins can view staff accounts"
  ON public.peso_staff
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
