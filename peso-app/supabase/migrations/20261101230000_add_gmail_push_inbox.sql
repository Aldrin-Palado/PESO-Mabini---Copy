alter table public.gmail_oauth_tokens
  add column history_id text,
  add column watch_expiration timestamptz,
  add column initial_sync_complete boolean not null default false;

create table public.gmail_messages (
  gmail_message_id text primary key,
  thread_id text not null,
  from_address text not null default '',
  to_address text not null default '',
  subject text not null default '(no subject)',
  snippet text not null default '',
  body_text text not null default '',
  internal_date timestamptz not null,
  received_at timestamptz not null default now()
);

create index gmail_messages_internal_date_idx
  on public.gmail_messages (internal_date desc);

alter table public.gmail_messages enable row level security;
revoke all on public.gmail_messages from anon, authenticated;
grant all on public.gmail_messages to service_role;
