CREATE TABLE public.peso_contact_rate_limits (
  rate_limit_key text PRIMARY KEY
    CHECK (rate_limit_key ~ '^[0-9a-f]{64}$'),
  last_submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX peso_contact_rate_limits_last_submitted_idx
  ON public.peso_contact_rate_limits (last_submitted_at);

ALTER TABLE public.peso_contact_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.peso_contact_rate_limits FROM anon, authenticated;
GRANT ALL ON public.peso_contact_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_peso_contact_submission(candidate_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  submission_allowed boolean := false;
BEGIN
  IF candidate_key !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  DELETE FROM public.peso_contact_rate_limits
  WHERE last_submitted_at < now() - interval '1 day';

  INSERT INTO public.peso_contact_rate_limits (rate_limit_key)
  VALUES (candidate_key)
  ON CONFLICT (rate_limit_key) DO UPDATE
    SET last_submitted_at = now()
    WHERE public.peso_contact_rate_limits.last_submitted_at
      < now() - interval '1 minute'
  RETURNING true INTO submission_allowed;

  RETURN coalesce(submission_allowed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_peso_contact_submission(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_peso_contact_submission(text)
  TO service_role;
