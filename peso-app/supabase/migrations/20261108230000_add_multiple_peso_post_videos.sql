ALTER TABLE public.peso_posts
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
WHERE id = 'peso-post-images';

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
SELECT
  'peso-post-images',
  'peso-post-images',
  true,
  104857600,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'peso-post-images'
);
