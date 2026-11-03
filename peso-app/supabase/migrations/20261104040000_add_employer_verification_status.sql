ALTER TABLE public.employer
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

UPDATE public.employer
SET verification_status = CASE
  WHEN is_verified THEN 'verified'
  ELSE 'pending'
END
WHERE verification_status IS NULL
   OR verification_status = 'pending';

ALTER TABLE public.employer
  DROP CONSTRAINT IF EXISTS employer_verification_status_check;

ALTER TABLE public.employer
  ADD CONSTRAINT employer_verification_status_check
  CHECK (verification_status IN ('pending', 'verified', 'not_approved'));

ALTER TABLE public.employer
  ALTER COLUMN verification_status SET DEFAULT 'pending',
  ALTER COLUMN is_verified SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_new_employer_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.verification_status := 'pending';
  NEW.is_verified := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_employer_pending ON public.employer;
CREATE TRIGGER trg_new_employer_pending
BEFORE INSERT ON public.employer
FOR EACH ROW
EXECUTE FUNCTION public.set_new_employer_pending();
