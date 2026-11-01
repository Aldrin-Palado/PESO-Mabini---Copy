create table public.gmail_oauth_states (
  state_hash text primary key check (state_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index gmail_oauth_states_expires_at_idx
  on public.gmail_oauth_states (expires_at);

create table public.gmail_oauth_tokens (
  account_email text primary key check (account_email = lower(account_email)),
  refresh_token_encrypted text not null,
  scope text,
  connected_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.gmail_oauth_states enable row level security;
alter table public.gmail_oauth_tokens enable row level security;

revoke all on public.gmail_oauth_states from anon, authenticated;
revoke all on public.gmail_oauth_tokens from anon, authenticated;
grant all on public.gmail_oauth_states to service_role;
grant all on public.gmail_oauth_tokens to service_role;
