ALTER TABLE public.peso_posts
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.peso_posts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND cardinality(image_urls) = 0;
