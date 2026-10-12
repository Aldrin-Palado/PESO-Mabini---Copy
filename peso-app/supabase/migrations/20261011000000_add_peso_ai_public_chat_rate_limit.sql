create extension if not exists pgcrypto with schema extensions;

create table if not exists public.peso_ai_chat_rate_limits (
  client_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (client_hash, window_start)
);

create index if not exists peso_ai_chat_rate_limits_window_start_idx
  on public.peso_ai_chat_rate_limits (window_start);

alter table public.peso_ai_chat_rate_limits enable row level security;
revoke all on public.peso_ai_chat_rate_limits from public, anon, authenticated;

create or replace function public.consume_peso_ai_chat_request(p_client_ip text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function public.consume_peso_ai_chat_request(text) from public, anon, authenticated;
grant execute on function public.consume_peso_ai_chat_request(text) to service_role;
