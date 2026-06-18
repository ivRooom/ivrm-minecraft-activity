create extension if not exists pgcrypto;

create table if not exists public.minecraft_servers (
  id text primary key,
  name text not null,
  environment text not null default 'production',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_accounts (
  id uuid primary key default gen_random_uuid(),
  minecraft_uuid text not null unique,
  minecraft_name text not null,
  discord_user_id text,
  linked_at timestamptz,
  verified_at timestamptz,
  whitelisted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_event_logs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  server_id text not null references public.minecraft_servers(id),
  event_type text not null,
  minecraft_uuid text not null,
  minecraft_name text not null,
  payload_json jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists public.minecraft_sessions (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  minecraft_name text not null,
  joined_at timestamptz not null,
  left_at timestamptz,
  last_seen_at timestamptz not null,
  total_seconds integer not null default 0,
  afk_seconds integer not null default 0,
  active_seconds integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_session_heartbeats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.minecraft_sessions(id) on delete cascade,
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  dimension text,
  afk boolean not null default false,
  sent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_minecraft_event_logs_server_received_at
  on public.minecraft_event_logs(server_id, received_at desc);

create index if not exists idx_minecraft_event_logs_event_type
  on public.minecraft_event_logs(event_type);

create index if not exists idx_minecraft_sessions_active
  on public.minecraft_sessions(server_id, minecraft_uuid, status)
  where status = 'active';

create index if not exists idx_minecraft_sessions_uuid_joined_at
  on public.minecraft_sessions(minecraft_uuid, joined_at desc);

create index if not exists idx_minecraft_heartbeats_session_sent_at
  on public.minecraft_session_heartbeats(session_id, sent_at desc);

create index if not exists idx_minecraft_heartbeats_server_id
  on public.minecraft_session_heartbeats(server_id);

alter table public.minecraft_servers enable row level security;
alter table public.minecraft_accounts enable row level security;
alter table public.minecraft_event_logs enable row level security;
alter table public.minecraft_sessions enable row level security;
alter table public.minecraft_session_heartbeats enable row level security;

revoke all on table public.minecraft_servers from anon, authenticated;
revoke all on table public.minecraft_accounts from anon, authenticated;
revoke all on table public.minecraft_event_logs from anon, authenticated;
revoke all on table public.minecraft_sessions from anon, authenticated;
revoke all on table public.minecraft_session_heartbeats from anon, authenticated;

insert into public.minecraft_servers (
  id,
  name,
  environment,
  enabled
)
values (
  'ivrm-craft',
  'いゔる。ーむ くらふと',
  'production',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  environment = excluded.environment,
  enabled = excluded.enabled,
  updated_at = now();
