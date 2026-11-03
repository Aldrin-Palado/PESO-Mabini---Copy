ALTER TABLE public.employer
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Employer manages own profile" ON public.employer;
CREATE POLICY "Employer manages own profile"
ON public.employer
FOR UPDATE
TO PUBLIC
USING (user_id = auth.uid() AND is_active = true)
WITH CHECK (user_id = auth.uid() AND is_active = true);
