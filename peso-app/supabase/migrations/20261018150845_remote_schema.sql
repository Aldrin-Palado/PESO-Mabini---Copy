SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.consume_peso_ai_chat_request (
  p_client_ip text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  normalized_ip text;
  current_window timestamptz;
  request_allowed boolean;
begin
  normalized_ip := left(trim(coalesce(p_client_ip, 'unknown')), 128);
  if normalized_ip = '' then
    normalized_ip := 'unknown';
  end if;
  current_window := date_trunc('hour', now());

  delete from public.peso_ai_chat_rate_limits
  where window_start < current_window - interval '48 hours';

  insert into public.peso_ai_chat_rate_limits (client_hash, window_start, request_count)
  values (
    encode(extensions.digest(convert_to(normalized_ip, 'UTF8'), 'sha256'), 'hex'),
    current_window,
    1
  )
  on conflict (client_hash, window_start)
  do update set request_count = public.peso_ai_chat_rate_limits.request_count + 1
  where public.peso_ai_chat_rate_limits.request_count < 20
  returning true into request_allowed;

  return coalesce(request_allowed, false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    user_role text;
    user_full_name text;
    user_email text;
BEGIN
    user_role := NEW.raw_user_meta_data->>'role';

    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        ''
    );

    user_email := NEW.email;

    IF user_role = 'jobseeker' THEN
        INSERT INTO public.job_seeker (
            user_id,
            full_name,
            email,
            is_active
        )
        VALUES (
            NEW.id,
            user_full_name,
            user_email,
            true
        )
        ON CONFLICT (user_id) DO NOTHING;

    ELSIF user_role = 'employer' THEN
        INSERT INTO public.employer (
            user_id,
            full_name,
            email,
            contact_person,
            is_active
        )
        VALUES (
            NEW.id,
            user_full_name,
            user_email,
            user_full_name,
            true
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$;

