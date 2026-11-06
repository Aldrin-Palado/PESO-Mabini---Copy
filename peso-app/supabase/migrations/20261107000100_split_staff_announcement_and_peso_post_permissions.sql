ALTER TABLE public.staff_permissions
  ADD COLUMN IF NOT EXISTS peso_posts boolean NOT NULL DEFAULT false;

UPDATE public.staff_permissions
SET peso_posts = notifications
WHERE notifications;

DROP POLICY IF EXISTS "PESO content staff can create posts" ON public.peso_posts;
CREATE POLICY "PESO content staff can create posts"
ON public.peso_posts
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.peso_staff staff
    JOIN public.staff_permissions permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    WHERE staff.user_id = auth.uid()
      AND staff.is_active
      AND permissions.peso_posts
  )
);

DROP POLICY IF EXISTS "PESO content staff can update posts" ON public.peso_posts;
CREATE POLICY "PESO content staff can update posts"
ON public.peso_posts
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.peso_staff staff
    JOIN public.staff_permissions permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    WHERE staff.user_id = auth.uid()
      AND staff.is_active
      AND permissions.peso_posts
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.peso_staff staff
    JOIN public.staff_permissions permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    WHERE staff.user_id = auth.uid()
      AND staff.is_active
      AND permissions.peso_posts
  )
);

DROP POLICY IF EXISTS "PESO content staff can delete posts" ON public.peso_posts;
CREATE POLICY "PESO content staff can delete posts"
ON public.peso_posts
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.peso_staff staff
    JOIN public.staff_permissions permissions
      ON permissions.peso_staff_id = staff.peso_staff_id
    WHERE staff.user_id = auth.uid()
      AND staff.is_active
      AND permissions.peso_posts
  )
);

DROP POLICY IF EXISTS "PESO content staff can upload post images" ON storage.objects;
CREATE POLICY "PESO content staff can upload post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'peso-post-images'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.peso_staff staff
      JOIN public.staff_permissions permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = auth.uid()
        AND staff.is_active
        AND permissions.peso_posts
    )
  )
);

DROP POLICY IF EXISTS "PESO content staff can update post images" ON storage.objects;
CREATE POLICY "PESO content staff can update post images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'peso-post-images'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.peso_staff staff
      JOIN public.staff_permissions permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = auth.uid()
        AND staff.is_active
        AND permissions.peso_posts
    )
  )
)
WITH CHECK (
  bucket_id = 'peso-post-images'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.peso_staff staff
      JOIN public.staff_permissions permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = auth.uid()
        AND staff.is_active
        AND permissions.peso_posts
    )
  )
);

DROP POLICY IF EXISTS "PESO content staff can delete post images" ON storage.objects;
CREATE POLICY "PESO content staff can delete post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'peso-post-images'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.peso_staff staff
      JOIN public.staff_permissions permissions
        ON permissions.peso_staff_id = staff.peso_staff_id
      WHERE staff.user_id = auth.uid()
        AND staff.is_active
        AND permissions.peso_posts
    )
  )
);
