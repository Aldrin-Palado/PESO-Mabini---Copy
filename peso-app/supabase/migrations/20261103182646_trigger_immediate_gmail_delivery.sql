CREATE OR REPLACE FUNCTION public.enqueue_peso_gmail_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_url text;
  job_secret text;
BEGIN
  IF NEW.message_origin = 'peso' AND NEW.gmail_message_id IS NULL THEN
    INSERT INTO public.peso_gmail_outbox (message_id)
    VALUES (NEW.message_id)
    ON CONFLICT (message_id) DO NOTHING;

    SELECT decrypted_secret
    INTO project_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_project_url';

    SELECT decrypted_secret
    INTO job_secret
    FROM vault.decrypted_secrets
    WHERE name = 'gmail_job_secret';

    IF coalesce(project_url, '') <> '' AND coalesce(job_secret, '') <> '' THEN
      BEGIN
        PERFORM net.http_post(
          url := rtrim(project_url, '/') || '/functions/v1/gmail-deliver-queued',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-gmail-job-secret', job_secret
          ),
          body := '{}'::jsonb
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING
          'Immediate Gmail delivery could not be triggered for message %: %',
          NEW.message_id,
          SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
