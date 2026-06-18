create table if not exists public.minecraft_reward_pools (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  pool_type text not null,
  name text not null,
  enabled boolean not null default true,
  timezone text not null default 'Asia/Tokyo',
  reset_time text not null default '00:00',
  draw_limit_per_day integer not null default 1,
  require_discord_link boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_reward_items (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.minecraft_reward_pools(id) on delete cascade,
  rarity text not null,
  weight integer not null,
  reward_name text not null,
  commands_json jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_reward_grants (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  reward_rule_id uuid,
  reward_type text not null,
  reward_name text not null,
  status text not null default 'pending',
  commands_json jsonb not null,
  granted_at timestamptz not null default now(),
  delivered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minecraft_random_reward_draws (
  id uuid primary key default gen_random_uuid(),
  server_id text not null references public.minecraft_servers(id),
  minecraft_uuid text not null,
  date date not null,
  pool_id uuid not null references public.minecraft_reward_pools(id),
  reward_item_id uuid not null references public.minecraft_reward_items(id),
  reward_grant_id uuid references public.minecraft_reward_grants(id),
  rarity text not null,
  reward_name text not null,
  probability numeric(6, 3) not null,
  status text not null default 'granted',
  drawn_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_minecraft_reward_pools_server_type
  on public.minecraft_reward_pools(server_id, pool_type);

create index if not exists idx_minecraft_reward_items_pool_enabled
  on public.minecraft_reward_items(pool_id, enabled);

create index if not exists idx_minecraft_reward_grants_pending
  on public.minecraft_reward_grants(server_id, minecraft_uuid, status);

create unique index if not exists minecraft_random_reward_draws_server_uuid_date_unique
  on public.minecraft_random_reward_draws(server_id, minecraft_uuid, date);

create index if not exists idx_minecraft_random_reward_draws_server_date
  on public.minecraft_random_reward_draws(server_id, date);

create index if not exists idx_minecraft_random_reward_draws_uuid_date
  on public.minecraft_random_reward_draws(minecraft_uuid, date);

alter table public.minecraft_reward_pools enable row level security;
alter table public.minecraft_reward_items enable row level security;
alter table public.minecraft_reward_grants enable row level security;
alter table public.minecraft_random_reward_draws enable row level security;

revoke all on table public.minecraft_reward_pools from anon, authenticated;
revoke all on table public.minecraft_reward_items from anon, authenticated;
revoke all on table public.minecraft_reward_grants from anon, authenticated;
revoke all on table public.minecraft_random_reward_draws from anon, authenticated;

insert into public.minecraft_reward_pools (
  server_id,
  pool_type,
  name,
  enabled,
  timezone,
  reset_time,
  draw_limit_per_day,
  require_discord_link
)
select
  'ivrm-craft',
  'daily_random',
  'Daily Random Reward',
  true,
  'Asia/Tokyo',
  '00:00',
  1,
  true
where not exists (
  select 1
  from public.minecraft_reward_pools
  where server_id = 'ivrm-craft'
    and pool_type = 'daily_random'
);

with daily_pool as (
  select id
  from public.minecraft_reward_pools
  where server_id = 'ivrm-craft'
    and pool_type = 'daily_random'
  limit 1
)
insert into public.minecraft_reward_items (
  pool_id,
  rarity,
  weight,
  reward_name,
  commands_json,
  enabled
)
select daily_pool.id, seed.rarity, seed.weight, seed.reward_name, seed.commands_json::jsonb, true
from daily_pool
cross join (
  values
    ('common', 70, 'パン 8個', '["give {player} minecraft:bread 8"]'),
    ('common', 70, '松明 16本', '["give {player} minecraft:torch 16"]'),
    ('common', 70, '石炭 8個', '["give {player} minecraft:coal 8"]'),
    ('uncommon', 22, '鉄インゴット 6個', '["give {player} minecraft:iron_ingot 6"]'),
    ('uncommon', 22, '安山岩合金 8個', '["give {player} create:andesite_alloy 8"]'),
    ('uncommon', 22, '米 16個', '["give {player} farmersdelight:rice 16"]'),
    ('rare', 7, 'エメラルド 4個', '["give {player} minecraft:emerald 4"]'),
    ('rare', 7, '金リンゴ 1個', '["give {player} minecraft:golden_apple 1"]'),
    ('legendary', 1, 'ダイヤモンド 1個', '["give {player} minecraft:diamond 1"]')
) as seed(rarity, weight, reward_name, commands_json)
where not exists (
  select 1
  from public.minecraft_reward_items existing
  where existing.pool_id = daily_pool.id
    and existing.reward_name = seed.reward_name
);
