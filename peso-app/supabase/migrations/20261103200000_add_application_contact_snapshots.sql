ALTER TABLE public.application
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS applicant_contact_no text,
  ADD COLUMN IF NOT EXISTS applicant_address text,
  ADD COLUMN IF NOT EXISTS applicant_resume_url text;
