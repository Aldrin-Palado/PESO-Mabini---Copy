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

