DROP POLICY IF EXISTS "Employers can insert their own job vacancies"
ON public.job_vacancy;

DROP POLICY IF EXISTS "Employers can create their own job posts"
ON public.job_vacancy;

CREATE POLICY "Verified employers can create their own job posts"
ON public.job_vacancy
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
      AND employer.is_active = true
      AND employer.is_verified = true
      AND employer.verification_status = 'verified'
  )
);
