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
