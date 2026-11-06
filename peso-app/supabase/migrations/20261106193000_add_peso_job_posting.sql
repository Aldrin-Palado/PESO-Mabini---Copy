ALTER TABLE public.employer
  ADD COLUMN IF NOT EXISTS is_peso boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS employer_single_peso_profile
  ON public.employer (is_peso)
  WHERE is_peso;

INSERT INTO public.employer (
  name,
  address,
  contact_person,
  is_active,
  is_verified,
  verification_status,
  is_peso
)
VALUES (
  'PESO Mabini',
  'Mabini, Batangas',
  'PESO Mabini',
  true,
  true,
  'verified',
  true
)
ON CONFLICT (is_peso) WHERE is_peso
DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  contact_person = EXCLUDED.contact_person,
  is_active = true,
  is_verified = true,
  verification_status = 'verified';

DROP POLICY IF EXISTS "Staff/Admin can view all job posts"
ON public.job_vacancy;
CREATE POLICY "Staff/Admin can view all job posts"
ON public.job_vacancy
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "PESO staff/admin can manage PESO job posts"
ON public.job_vacancy;
CREATE POLICY "PESO staff/admin can manage PESO job posts"
ON public.job_vacancy
FOR ALL
TO authenticated
USING (
  public.is_staff_or_admin()
  AND EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.is_peso = true
  )
)
WITH CHECK (
  public.is_staff_or_admin()
  AND EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.employer_id = job_vacancy.employer_id
      AND employer.is_peso = true
  )
);
