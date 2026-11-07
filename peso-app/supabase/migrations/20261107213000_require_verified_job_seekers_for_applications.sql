DROP POLICY IF EXISTS "Job seeker manages own applications" ON public.application;

CREATE POLICY "Job seekers view own applications" ON public.application
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS js
      WHERE js.job_seeker_id = application.job_seeker_id
        AND js.user_id = auth.uid()
    )
  );

CREATE POLICY "Verified job seekers submit applications" ON public.application
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS js
      WHERE js.job_seeker_id = application.job_seeker_id
        AND js.user_id = auth.uid()
        AND js.verification_status = 'verified'
    )
  );

CREATE POLICY "Job seekers update own applications" ON public.application
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS js
      WHERE js.job_seeker_id = application.job_seeker_id
        AND js.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS js
      WHERE js.job_seeker_id = application.job_seeker_id
        AND js.user_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers delete own applications" ON public.application
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS js
      WHERE js.job_seeker_id = application.job_seeker_id
        AND js.user_id = auth.uid()
    )
  );
