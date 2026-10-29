ALTER TABLE public.job_vacancy
  ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'job-images',
  'job-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Employers can upload images for their own job posts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-images'
  AND array_length(storage.foldername(name), 1) = 2
  AND EXISTS (
    SELECT 1
    FROM public.employer AS employer
    WHERE employer.user_id = auth.uid()
      AND employer.employer_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Employers can view their own job post images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-images'
  AND array_length(storage.foldername(name), 1) = 2
  AND EXISTS (
    SELECT 1
    FROM public.employer AS employer
    WHERE employer.user_id = auth.uid()
      AND employer.employer_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Employers can update their own job post images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-images'
  AND array_length(storage.foldername(name), 1) = 2
  AND EXISTS (
    SELECT 1
    FROM public.employer AS employer
    WHERE employer.user_id = auth.uid()
      AND employer.employer_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'job-images'
  AND array_length(storage.foldername(name), 1) = 2
  AND EXISTS (
    SELECT 1
    FROM public.employer AS employer
    WHERE employer.user_id = auth.uid()
      AND employer.employer_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Employers can delete their own job post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-images'
  AND array_length(storage.foldername(name), 1) = 2
  AND EXISTS (
    SELECT 1
    FROM public.employer AS employer
    WHERE employer.user_id = auth.uid()
      AND employer.employer_id::text = (storage.foldername(name))[1]
  )
);
