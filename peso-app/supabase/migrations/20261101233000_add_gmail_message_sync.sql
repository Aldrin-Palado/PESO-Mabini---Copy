ALTER TABLE public.peso_messages
  ADD COLUMN message_origin text NOT NULL DEFAULT 'peso',
  ADD COLUMN gmail_message_id text,
  ADD COLUMN gmail_thread_id text,
  ADD COLUMN rfc822_message_id text,
  ADD CONSTRAINT peso_messages_origin_check
    CHECK (message_origin IN ('peso', 'gmail')),
  ADD CONSTRAINT peso_messages_gmail_id_check
    CHECK (message_origin = 'peso' OR gmail_message_id IS NOT NULL);

CREATE UNIQUE INDEX peso_messages_gmail_message_id_uidx
  ON public.peso_messages (gmail_message_id)
  WHERE gmail_message_id IS NOT NULL;

CREATE TABLE public.peso_gmail_conversations (
  conversation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_low uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_high uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_low_email text NOT NULL,
  participant_high_email text NOT NULL,
  gmail_thread_id text UNIQUE,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT peso_gmail_conversation_order_check
    CHECK (participant_low < participant_high),
  CONSTRAINT peso_gmail_conversation_distinct_emails_check
    CHECK (
      participant_low_email = lower(btrim(participant_low_email))
      AND participant_high_email = lower(btrim(participant_high_email))
    ),
  CONSTRAINT peso_gmail_conversation_pair_uidx
    UNIQUE (participant_low, participant_high)
);

CREATE TABLE public.peso_gmail_message_links (
  gmail_message_id text PRIMARY KEY,
  conversation_id uuid NOT NULL
    REFERENCES public.peso_gmail_conversations(conversation_id) ON DELETE CASCADE,
  peso_message_id uuid NOT NULL
    REFERENCES public.peso_messages(message_id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  rfc822_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (peso_message_id)
);

CREATE TABLE public.peso_gmail_outbox (
  outbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL UNIQUE
    REFERENCES public.peso_messages(message_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX peso_gmail_outbox_ready_idx
  ON public.peso_gmail_outbox (available_at, created_at)
  WHERE status IN ('pending', 'processing');

CREATE TABLE public.peso_gmail_delivery_logs (
  log_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  outbox_id uuid NOT NULL
    REFERENCES public.peso_gmail_outbox(outbox_id) ON DELETE CASCADE,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  error text
);

CREATE TABLE public.peso_gmail_sync_logs (
  log_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL CHECK (source IN ('pubsub', 'watch_renewal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  error text NOT NULL
);

ALTER TABLE public.peso_gmail_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peso_gmail_message_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peso_gmail_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peso_gmail_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peso_gmail_sync_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.peso_gmail_conversations,
  public.peso_gmail_message_links,
  public.peso_gmail_outbox,
  public.peso_gmail_delivery_logs,
  public.peso_gmail_sync_logs
  FROM anon, authenticated;
GRANT ALL ON public.peso_gmail_conversations,
  public.peso_gmail_message_links,
  public.peso_gmail_outbox,
  public.peso_gmail_delivery_logs,
  public.peso_gmail_sync_logs
  TO service_role;

REVOKE INSERT ON public.peso_messages FROM authenticated;
GRANT INSERT (employer_id, sender_user_id, recipient_user_id, body)
  ON public.peso_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.get_peso_message_address(candidate_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(btrim(users.email))
  FROM auth.users AS users
  WHERE users.id = candidate_user_id
    AND users.email_confirmed_at IS NOT NULL
    AND public.is_peso_message_user(candidate_user_id);
$$;

REVOKE ALL ON FUNCTION public.get_peso_message_address(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_peso_message_address(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_peso_gmail_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.message_origin = 'peso' AND NEW.gmail_message_id IS NULL THEN
    INSERT INTO public.peso_gmail_outbox (message_id)
    VALUES (NEW.message_id)
    ON CONFLICT (message_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER peso_messages_enqueue_gmail_delivery
  AFTER INSERT ON public.peso_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_peso_gmail_delivery();

CREATE OR REPLACE FUNCTION public.claim_peso_gmail_outbox(batch_size integer DEFAULT 10)
RETURNS TABLE (outbox_id uuid, message_id uuid, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT queue.outbox_id
    FROM public.peso_gmail_outbox AS queue
    JOIN public.peso_messages AS message
      ON message.message_id = queue.message_id
    WHERE ((
      queue.status = 'pending'
      AND queue.available_at <= now()
    ) OR (
      queue.status = 'processing'
      AND queue.locked_until < now()
    ))
    AND NOT EXISTS (
      SELECT 1
      FROM public.peso_gmail_outbox AS active_queue
      JOIN public.peso_messages AS active_message
        ON active_message.message_id = active_queue.message_id
      WHERE active_queue.outbox_id <> queue.outbox_id
        AND active_queue.status = 'processing'
        AND active_queue.locked_until > now()
        AND least(active_message.sender_user_id, active_message.recipient_user_id)
          = least(message.sender_user_id, message.recipient_user_id)
        AND greatest(active_message.sender_user_id, active_message.recipient_user_id)
          = greatest(message.sender_user_id, message.recipient_user_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.peso_gmail_outbox AS earlier_queue
      JOIN public.peso_messages AS earlier_message
        ON earlier_message.message_id = earlier_queue.message_id
      WHERE earlier_queue.status IN ('pending', 'processing')
        AND (earlier_queue.created_at, earlier_queue.outbox_id)
          < (queue.created_at, queue.outbox_id)
        AND least(earlier_message.sender_user_id, earlier_message.recipient_user_id)
          = least(message.sender_user_id, message.recipient_user_id)
        AND greatest(earlier_message.sender_user_id, earlier_message.recipient_user_id)
          = greatest(message.sender_user_id, message.recipient_user_id)
    )
    AND pg_try_advisory_xact_lock(
      hashtextextended(
        least(message.sender_user_id::text, message.recipient_user_id::text)
          || ':' ||
        greatest(message.sender_user_id::text, message.recipient_user_id::text),
        0
      )
    )
    ORDER BY queue.available_at, queue.created_at
    LIMIT greatest(1, least(batch_size, 25))
    FOR UPDATE OF queue SKIP LOCKED
  )
  UPDATE public.peso_gmail_outbox AS queue
  SET status = 'processing',
      attempt_count = queue.attempt_count + 1,
      locked_until = now() + interval '5 minutes',
      updated_at = now()
  FROM candidates
  WHERE queue.outbox_id = candidates.outbox_id
  RETURNING queue.outbox_id, queue.message_id, queue.attempt_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_peso_gmail_outbox(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_peso_gmail_outbox(integer) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'peso_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.peso_messages;
  END IF;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE OR REPLACE FUNCTION public.schedule_peso_gmail_jobs()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_url text;
  job_secret text;
  cron_command text;
  existing_job record;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'supabase_project_url';
  SELECT decrypted_secret INTO job_secret
  FROM vault.decrypted_secrets WHERE name = 'gmail_job_secret';

  IF coalesce(project_url, '') = '' OR coalesce(job_secret, '') = '' THEN
    RAISE NOTICE 'Set Vault secrets supabase_project_url and gmail_job_secret, then call schedule_peso_gmail_jobs().';
    RETURN false;
  END IF;

  FOR existing_job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('peso-gmail-outbox', 'peso-gmail-watch-renewal')
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;

  cron_command :=
    'SELECT net.http_post(' ||
    'url := rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets ' ||
      'WHERE name = ''supabase_project_url''), ''/'') || ' ||
      '''/functions/v1/gmail-deliver-queued'', ' ||
    'headers := jsonb_build_object(''Content-Type'', ''application/json'', ' ||
      '''x-gmail-job-secret'', (SELECT decrypted_secret FROM vault.decrypted_secrets ' ||
        'WHERE name = ''gmail_job_secret'')), ' ||
    'body := ''{}''::jsonb);';
  PERFORM cron.schedule('peso-gmail-outbox', '* * * * *', cron_command);

  cron_command :=
    'SELECT net.http_post(' ||
    'url := rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets ' ||
      'WHERE name = ''supabase_project_url''), ''/'') || ' ||
      '''/functions/v1/gmail-watch-renewal'', ' ||
    'headers := jsonb_build_object(''Content-Type'', ''application/json'', ' ||
      '''x-gmail-job-secret'', (SELECT decrypted_secret FROM vault.decrypted_secrets ' ||
        'WHERE name = ''gmail_job_secret'')), ' ||
    'body := ''{}''::jsonb);';
  PERFORM cron.schedule('peso-gmail-watch-renewal', '0 3 * * *', cron_command);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_peso_gmail_jobs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_peso_gmail_jobs() TO service_role;

DO $$
BEGIN
  PERFORM public.schedule_peso_gmail_jobs();
END;
$$;
