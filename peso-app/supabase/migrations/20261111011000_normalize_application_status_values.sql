BEGIN;

ALTER TYPE public.application_status
  ADD VALUE IF NOT EXISTS 'qualified';

ALTER TYPE public.application_status
  ADD VALUE IF NOT EXISTS 'interviewed';

ALTER TYPE public.application_status
  ADD VALUE IF NOT EXISTS 'withdrawn';

UPDATE public.application
SET status = 'interviewed'::public.application_status
WHERE status = 'interview'::public.application_status;

COMMIT;
