CREATE OR REPLACE FUNCTION public.can_employer_view_applicant_profile_photo(
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
    WHERE employer.user_id = (SELECT auth.uid())
      AND object_name = seeker.user_id::text || '/avatar'
  );
$$;

REVOKE ALL ON FUNCTION public.can_employer_view_applicant_profile_photo(text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_employer_view_applicant_profile_photo(text)
TO authenticated;

DROP POLICY IF EXISTS "Employers can view applicant profile photos"
ON storage.objects;

CREATE POLICY "Employers can view applicant profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'peso-profile-photos'
  AND public.can_employer_view_applicant_profile_photo(name)
);
