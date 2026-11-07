CREATE OR REPLACE FUNCTION public.protect_employer_document_reviews()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  submitted_documents jsonb;
  retained_reviewed_documents jsonb;
BEGIN
  IF OLD.user_id = auth.uid() AND NOT public.is_staff_or_admin() THEN
    NEW.verification_status := OLD.verification_status;
    NEW.is_verified := OLD.is_verified;

    SELECT coalesce(
      jsonb_agg(
        CASE
          WHEN previous.document IS NOT NULL THEN
            submitted.document || jsonb_build_object(
              'status', previous.document->'status',
              'reviewed_at', previous.document->'reviewed_at',
              'review_note', previous.document->'review_note'
            )
          ELSE
            submitted.document || jsonb_build_object(
              'status', 'pending',
              'reviewed_at', NULL,
              'review_note', NULL
            )
        END
      ),
      '[]'::jsonb
    )
    INTO submitted_documents
    FROM jsonb_array_elements(
      coalesce(NEW.verification_documents, '[]'::jsonb)
    ) AS submitted(document)
    LEFT JOIN LATERAL (
      SELECT existing.document
      FROM jsonb_array_elements(
        coalesce(OLD.verification_documents, '[]'::jsonb)
      ) AS existing(document)
      WHERE existing.document->>'id' = submitted.document->>'id'
        AND existing.document->>'storage_path' = submitted.document->>'storage_path'
      LIMIT 1
    ) AS previous ON true;

    SELECT coalesce(jsonb_agg(existing.document), '[]'::jsonb)
    INTO retained_reviewed_documents
    FROM jsonb_array_elements(
      coalesce(OLD.verification_documents, '[]'::jsonb)
    ) AS existing(document)
    WHERE existing.document->>'status' IN ('approved', 'rejected')
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(submitted_documents) AS submitted(document)
        WHERE submitted.document->>'id' = existing.document->>'id'
          AND submitted.document->>'storage_path' = existing.document->>'storage_path'
      );

    NEW.verification_documents :=
      submitted_documents || retained_reviewed_documents;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_employer_document_reviews
  ON public.employer;
CREATE TRIGGER trg_protect_employer_document_reviews
BEFORE UPDATE ON public.employer
FOR EACH ROW
EXECUTE FUNCTION public.protect_employer_document_reviews();

DROP POLICY IF EXISTS "Employers update their own verification documents"
  ON storage.objects;
CREATE POLICY "Employers update their own verification documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND NOT EXISTS (
    SELECT 1
    FROM public.employer
    CROSS JOIN LATERAL jsonb_array_elements(employer.verification_documents) AS document(value)
    WHERE employer.user_id = (SELECT auth.uid())
      AND document.value->>'storage_path' = name
      AND document.value->>'status' IN ('approved', 'rejected')
  )
)
WITH CHECK (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Employers delete their own verification documents"
  ON storage.objects;
CREATE POLICY "Employers delete their own verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND NOT EXISTS (
    SELECT 1
    FROM public.employer
    CROSS JOIN LATERAL jsonb_array_elements(employer.verification_documents) AS document(value)
    WHERE employer.user_id = (SELECT auth.uid())
      AND document.value->>'storage_path' = name
      AND document.value->>'status' IN ('approved', 'rejected')
  )
);
