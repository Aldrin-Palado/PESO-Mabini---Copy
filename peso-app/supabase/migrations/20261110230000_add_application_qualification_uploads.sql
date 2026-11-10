ALTER TABLE public.application
  ADD COLUMN IF NOT EXISTS applicant_qualification_files jsonb
    NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.application
  DROP CONSTRAINT IF EXISTS application_qualification_files_array_check;

ALTER TABLE public.application
  ADD CONSTRAINT application_qualification_files_array_check
  CHECK (jsonb_typeof(applicant_qualification_files) = 'array');

CREATE OR REPLACE FUNCTION public.can_employer_view_application_document(
  object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.application AS application_record
    JOIN public.job_seeker AS seeker
      ON seeker.job_seeker_id = application_record.job_seeker_id
    JOIN public.employer AS employer
      ON employer.employer_id = application_record.employer_id
    WHERE seeker.user_id::text =
      (storage.foldername(object_name))[1]
      AND employer.user_id = (SELECT auth.uid())
      AND (
        application_record.applicant_resume_url = object_name
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            application_record.applicant_qualification_files
          ) AS uploaded_document(document)
          WHERE uploaded_document.document ->> 'path' = object_name
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_employer_view_application_document(text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_employer_view_application_document(text)
TO authenticated;

DROP POLICY IF EXISTS "Employers can view applicant application documents"
ON storage.objects;

CREATE POLICY "Employers can view applicant application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Resume Files'
  AND public.can_employer_view_application_document(name)
);
