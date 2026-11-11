ALTER TYPE public.application_status
  ADD VALUE IF NOT EXISTS 'qualified';

ALTER TYPE public.application_status
  ADD VALUE IF NOT EXISTS 'interviewed';
