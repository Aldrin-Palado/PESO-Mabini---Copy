CREATE OR REPLACE FUNCTION public.current_staff_has_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT CASE permission_key
        WHEN 'dashboard_overview' THEN permissions.dashboard_overview
        WHEN 'job_posts' THEN permissions.job_posts
        WHEN 'job_application' THEN permissions.job_application
        WHEN 'employers' THEN permissions.employers
        WHEN 'job_seekers' THEN permissions.job_seekers
        WHEN 'analytics' THEN permissions.analytics
        ELSE false
      END
      FROM public.peso_staff AS staff
      JOIN public.staff_permissions AS permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = (SELECT auth.uid())
        AND staff.is_active
      LIMIT 1
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.current_staff_has_permission(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_staff_has_permission(text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.is_accessible_peso_employer(target_employer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (
      public.is_admin()
      OR public.current_staff_has_permission('job_posts')
    )
    AND EXISTS (
      SELECT 1
      FROM public.employer AS employer
      WHERE employer.employer_id = target_employer_id
        AND employer.is_peso IS TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.is_accessible_peso_employer(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_accessible_peso_employer(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_job_post_employer_summaries()
RETURNS TABLE(employer_id uuid, name text, logo_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    public.is_admin()
    OR public.current_staff_has_permission('job_posts')
  ) THEN
    RAISE EXCEPTION 'You are not authorized to view job post employer summaries.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT employer.employer_id, employer.name, employer.logo_url
  FROM public.employer AS employer
  WHERE EXISTS (
    SELECT 1
    FROM public.job_vacancy AS job
    WHERE job.employer_id = employer.employer_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_job_post_employer_summaries()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_post_employer_summaries()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_job_seeker_application_counts()
RETURNS TABLE(job_seeker_id uuid, application_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    public.is_admin()
    OR public.current_staff_has_permission('job_seekers')
  ) THEN
    RAISE EXCEPTION 'You are not authorized to view job seeker application counts.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT application.job_seeker_id, count(*)::bigint
  FROM public.application AS application
  WHERE application.job_seeker_id IS NOT NULL
  GROUP BY application.job_seeker_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_job_seeker_application_counts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_seeker_application_counts()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_staff_dashboard_overview_counts()
RETURNS TABLE(
  job_posts bigint,
  applications bigint,
  employers bigint,
  job_seekers bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.current_staff_has_permission('dashboard_overview') THEN
    RAISE EXCEPTION 'You are not authorized to view the staff dashboard overview.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    CASE
      WHEN public.current_staff_has_permission('job_posts')
        THEN (SELECT count(*)::bigint FROM public.job_vacancy)
      ELSE NULL::bigint
    END,
    CASE
      WHEN public.current_staff_has_permission('job_application')
        THEN (SELECT count(*)::bigint FROM public.application)
      ELSE NULL::bigint
    END,
    CASE
      WHEN public.current_staff_has_permission('employers')
        THEN (SELECT count(*)::bigint FROM public.employer)
      ELSE NULL::bigint
    END,
    CASE
      WHEN public.current_staff_has_permission('job_seekers')
        THEN (SELECT count(*)::bigint FROM public.job_seeker)
      ELSE NULL::bigint
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.get_staff_dashboard_overview_counts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_staff_dashboard_overview_counts()
  TO authenticated;

DROP POLICY IF EXISTS "Staff/Admin manage all applications"
  ON public.application;

CREATE POLICY "Admins manage all applications"
  ON public.application
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Application staff can view all applications"
  ON public.application
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('job_application'));

CREATE POLICY "Analytics staff can view all applications"
  ON public.application
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('analytics'));

CREATE POLICY "Application staff can update applications"
  ON public.application
  FOR UPDATE
  TO authenticated
  USING (public.current_staff_has_permission('job_application'))
  WITH CHECK (public.current_staff_has_permission('job_application'));

DROP POLICY IF EXISTS "Staff/Admin can view all job posts"
  ON public.job_vacancy;
DROP POLICY IF EXISTS "PESO staff/admin can manage PESO job posts"
  ON public.job_vacancy;

CREATE POLICY "Admins can view all job posts"
  ON public.job_vacancy
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authorized staff can view job posts"
  ON public.job_vacancy
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_has_permission('job_posts')
    OR public.current_staff_has_permission('job_application')
    OR public.current_staff_has_permission('analytics')
  );

CREATE POLICY "Authorized PESO staff can manage PESO job posts"
  ON public.job_vacancy
  FOR ALL
  TO authenticated
  USING (
    public.is_accessible_peso_employer(employer_id)
  )
  WITH CHECK (
    public.is_accessible_peso_employer(employer_id)
  );

DROP POLICY IF EXISTS "Staff/Admin manage employers"
  ON public.employer;
DROP POLICY IF EXISTS "Employer and staff can view employer records"
  ON public.employer;

CREATE POLICY "Admins manage all employers"
  ON public.employer
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Employer staff can view employer records"
  ON public.employer
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('employers'));

CREATE POLICY "Application staff can view employer records"
  ON public.employer
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('job_application'));

CREATE POLICY "Analytics staff can view employer records"
  ON public.employer
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('analytics'));

CREATE POLICY "Employer staff can update employer records"
  ON public.employer
  FOR UPDATE
  TO authenticated
  USING (public.current_staff_has_permission('employers'))
  WITH CHECK (public.current_staff_has_permission('employers'));

DROP POLICY IF EXISTS "Staff/Admin view & manage job seekers"
  ON public.job_seeker;

CREATE POLICY "Admins manage all job seekers"
  ON public.job_seeker
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Job seeker staff can view job seeker records"
  ON public.job_seeker
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('job_seekers'));

CREATE POLICY "Application staff can view applicant profiles"
  ON public.job_seeker
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('job_application'));

CREATE POLICY "Analytics staff can view job seeker records"
  ON public.job_seeker
  FOR SELECT
  TO authenticated
  USING (public.current_staff_has_permission('analytics'));

CREATE POLICY "Job seeker staff can update job seeker records"
  ON public.job_seeker
  FOR UPDATE
  TO authenticated
  USING (public.current_staff_has_permission('job_seekers'))
  WITH CHECK (public.current_staff_has_permission('job_seekers'));
