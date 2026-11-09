DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'peso_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.peso_messages;
  END IF;

END;
$$;
