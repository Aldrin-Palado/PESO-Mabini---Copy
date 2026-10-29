DROP POLICY IF EXISTS "Employers can view their own job posts"
ON public.job_vacancy;
DROP POLICY IF EXISTS "Employers can create their own job posts"
ON public.job_vacancy;
DROP POLICY IF EXISTS "Employers can update their own job posts"
ON public.job_vacancy;
DROP POLICY IF EXISTS "Employers can delete their own job posts"
ON public.job_vacancy;
DROP POLICY IF EXISTS "Public can view open job vacancies"
ON public.job_vacancy;
DROP POLICY IF EXISTS "Anyone can view open job posts"
ON public.job_vacancy;

CREATE POLICY "Anyone can view open job posts"
ON public.job_vacancy
FOR SELECT
TO anon, authenticated
USING (status = 'open');

CREATE POLICY "Employers can view their own job posts"
ON public.job_vacancy
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can create their own job posts"
ON public.job_vacancy
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can update their own job posts"
ON public.job_vacancy
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can delete their own job posts"
ON public.job_vacancy
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.user_id = auth.uid()
  )
);
