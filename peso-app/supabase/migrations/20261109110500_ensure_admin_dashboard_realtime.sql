DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'application'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.application;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'employer'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employer;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'job_seeker'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_seeker;
  END IF;
END;
$$;
