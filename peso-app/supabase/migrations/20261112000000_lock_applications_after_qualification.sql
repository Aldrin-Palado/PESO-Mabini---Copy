DROP POLICY IF EXISTS "Job seekers update own applications"
  ON public.application;

CREATE POLICY "Job seekers update applications before qualification"
  ON public.application
  FOR UPDATE
  TO authenticated
  USING (
    status IN (
      'pending'::public.application_status,
      'under_review'::public.application_status,
      'shortlisted'::public.application_status
    )
    AND EXISTS (
      SELECT 1
      FROM public.job_seeker AS seeker
      WHERE seeker.job_seeker_id = application.job_seeker_id
        AND seeker.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_seeker AS seeker
      WHERE seeker.job_seeker_id = application.job_seeker_id
        AND seeker.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job seekers delete own applications"
  ON public.application;

CREATE POLICY "Job seekers delete applications before qualification"
  ON public.application
  FOR DELETE
  TO authenticated
  USING (
    status IN (
      'pending'::public.application_status,
      'under_review'::public.application_status,
      'shortlisted'::public.application_status
    )
    AND EXISTS (
      SELECT 1
      FROM public.job_seeker AS seeker
      WHERE seeker.job_seeker_id = application.job_seeker_id
        AND seeker.user_id = auth.uid()
    )
  );
