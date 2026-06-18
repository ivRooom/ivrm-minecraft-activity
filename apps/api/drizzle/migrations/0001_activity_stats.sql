create table if not exists public.minecraft_daily_stats (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  date date not null,
  login_count integer not null default 0,
  active_seconds integer not null default 0,
  afk_seconds integer not null default 0,
  death_count integer not null default 0,
  chat_count integer not null default 0,
  block_place_count integer not null default 0,
  block_break_count integer not null default 0,
  advancement_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_monthly_stats (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  year_month text not null,
  login_days integer not null default 0,
  login_count integer not null default 0,
  active_seconds integer not null default 0,
  afk_seconds integer not null default 0,
  death_count integer not null default 0,
  chat_count integer not null default 0,
  block_place_count integer not null default 0,
  block_break_count integer not null default 0,
  advancement_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists minecraft_daily_stats_server_uuid_date_unique
  on public.minecraft_daily_stats(server_id, minecraft_uuid, date);

create index if not exists idx_minecraft_daily_stats_server_date_active
  on public.minecraft_daily_stats(server_id, date, active_seconds);

create index if not exists idx_minecraft_daily_stats_uuid_date
  on public.minecraft_daily_stats(minecraft_uuid, date);

create unique index if not exists minecraft_monthly_stats_server_uuid_month_unique
  on public.minecraft_monthly_stats(server_id, minecraft_uuid, year_month);

create index if not exists idx_minecraft_monthly_stats_server_month_active
  on public.minecraft_monthly_stats(server_id, year_month, active_seconds);

create index if not exists idx_minecraft_monthly_stats_uuid_month
  on public.minecraft_monthly_stats(minecraft_uuid, year_month);

alter table public.minecraft_daily_stats enable row level security;
alter table public.minecraft_monthly_stats enable row level security;

revoke all on table public.minecraft_daily_stats from anon, authenticated;
revoke all on table public.minecraft_monthly_stats from anon, authenticated;
