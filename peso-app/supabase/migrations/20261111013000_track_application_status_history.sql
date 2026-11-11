CREATE TABLE public.application_status_history (
  history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.application(application_id) ON DELETE CASCADE,
  status public.application_status NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  is_backfill boolean NOT NULL DEFAULT false
);

CREATE INDEX application_status_history_application_status_idx
  ON public.application_status_history (application_id, status);

ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.application_status_history TO authenticated;

CREATE POLICY "Staff and admins can view application status history"
  ON public.application_status_history
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

CREATE OR REPLACE FUNCTION public.track_application_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_status_history (
      application_id,
      status,
      changed_at
    )
    VALUES (
      NEW.application_id,
      NEW.status,
      COALESCE(NEW.date_applied, now())
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_history (
      application_id,
      status,
      changed_at
    )
    VALUES (
      NEW.application_id,
      NEW.status,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER record_application_status_on_insert
  AFTER INSERT ON public.application
  FOR EACH ROW
  EXECUTE FUNCTION public.track_application_status_history();

CREATE TRIGGER record_application_status_on_update
  AFTER UPDATE OF status ON public.application
  FOR EACH ROW
  EXECUTE FUNCTION public.track_application_status_history();

INSERT INTO public.application_status_history (
  application_id,
  status,
  changed_at,
  is_backfill
)
SELECT
  application.application_id,
  application.status,
  COALESCE(application.updated_at, application.date_applied, now()),
  true
FROM public.application;
