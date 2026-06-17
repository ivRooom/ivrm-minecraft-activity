# Database Design

## Policy

- Minecraft account identity uses UUID as the stable key.
- Minecraft name is display-only and can change.
- Raw event logs are retained for a limited period.
- Aggregated daily/monthly stats are retained long term.
- Reward grants must be idempotent.

## Core tables

```text
users
minecraft_accounts
minecraft_servers
minecraft_sessions
minecraft_session_heartbeats
minecraft_daily_stats
minecraft_monthly_stats
minecraft_event_logs
minecraft_player_counters
minecraft_dimension_times
minecraft_afk_periods
minecraft_reward_rules
minecraft_reward_pools
minecraft_reward_items
minecraft_reward_grants
minecraft_random_reward_draws
minecraft_ranking_snapshots
minecraft_ranking_posts
minecraft_award_roles
minecraft_whitelist_requests
```

## minecraft_accounts

```sql
id uuid primary key
user_id uuid null
discord_user_id text null
minecraft_uuid text not null unique
minecraft_name text not null
linked_at timestamptz null
verified_at timestamptz null
whitelisted_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## minecraft_sessions

```sql
id uuid primary key
server_id text not null
minecraft_uuid text not null
minecraft_name text not null
joined_at timestamptz not null
left_at timestamptz null
last_seen_at timestamptz not null
total_seconds integer not null default 0
afk_seconds integer not null default 0
active_seconds integer not null default 0
status text not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## minecraft_daily_stats

```sql
id uuid primary key
server_id text not null
minecraft_uuid text not null
date date not null
login_count integer not null default 0
active_seconds integer not null default 0
afk_seconds integer not null default 0
death_count integer not null default 0
chat_count integer not null default 0
block_place_count integer not null default 0
block_break_count integer not null default 0
advancement_count integer not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(server_id, minecraft_uuid, date)
```

## minecraft_reward_grants

```sql
id uuid primary key
server_id text not null
minecraft_uuid text not null
reward_rule_id uuid not null
reward_type text not null
reward_name text not null
status text not null
commands_json jsonb not null
granted_at timestamptz not null
delivered_at timestamptz null
expires_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## minecraft_random_reward_draws

```sql
id uuid primary key
server_id text not null
minecraft_uuid text not null
date date not null
pool_id uuid not null
rarity text not null
reward_name text not null
probability numeric not null
status text not null
drawn_at timestamptz not null
delivered_at timestamptz null
created_at timestamptz not null default now()
unique(server_id, minecraft_uuid, date)
```

## Important indexes

```sql
create index idx_minecraft_sessions_uuid_joined_at on minecraft_sessions(minecraft_uuid, joined_at desc);
create index idx_minecraft_daily_stats_month on minecraft_daily_stats(server_id, date);
create index idx_minecraft_event_logs_event_id on minecraft_event_logs(event_id);
create index idx_minecraft_reward_grants_pending on minecraft_reward_grants(server_id, minecraft_uuid, status);
```
