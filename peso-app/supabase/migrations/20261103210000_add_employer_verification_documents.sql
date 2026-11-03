
-- Add verification documents column to employer table
ALTER TABLE public.employer
  ADD COLUMN IF NOT EXISTS verification_documents jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create private storage bucket for employer verification documents
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'employer-verification-documents',
  'employer-verification-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Employers can upload their own verification documents
DROP POLICY IF EXISTS "Employers upload their own verification documents"
ON storage.objects;

CREATE POLICY "Employers upload their own verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.employer
    WHERE employer.user_id = (SELECT auth.uid())
  )
);

-- Employers and staff can view verification documents
DROP POLICY IF EXISTS "Employers and staff view verification documents"
ON storage.objects;

CREATE POLICY "Employers and staff view verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employer-verification-documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR public.is_staff_or_admin()
  )
);

-- Employers can update their own verification documents
DROP POLICY IF EXISTS "Employers update their own verification documents"
ON storage.objects;

CREATE POLICY "Employers update their own verification documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Employers can delete their own verification documents
DROP POLICY IF EXISTS "Employers delete their own verification documents"
ON storage.objects;

CREATE POLICY "Employers delete their own verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employer-verification-documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
