
-- Remove broad storage policies that bypass employer folder ownership checks.
DROP POLICY IF EXISTS "Authenticated users can update job images"
ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload job images"
ON storage.objects;
