# Database Design

## Policy

- Minecraft account identity uses UUID as the stable key.
- Minecraft name is display-only and can change.
- Raw event logs are retained for a limited period.
- Aggregated daily/monthly stats are retained long term.
- Reward grants must be idempotent.
- Daily random rewards are free only, once per Asia/Tokyo date, and are not tied to real money or donation benefits.
- Browser clients do not connect to Supabase directly for this feature. `api.ivrm.jp` connects to PostgreSQL with `DATABASE_URL`.
- Tables in `public` must have RLS enabled and no public policies until a direct Data API use case is explicitly designed.

## MVP tables

The first persistence milestone stores signed Minecraft events, session state, activity aggregates, and daily random reward grants.

```text
minecraft_servers
minecraft_accounts
minecraft_event_logs
minecraft_sessions
minecraft_session_heartbeats
minecraft_daily_stats
minecraft_monthly_stats
minecraft_reward_pools
minecraft_reward_items
minecraft_reward_grants
minecraft_random_reward_draws
```

## Core tables planned later

```text
users
minecraft_player_counters
minecraft_dimension_times
minecraft_afk_periods
minecraft_reward_rules
minecraft_ranking_snapshots
minecraft_ranking_posts
minecraft_award_roles
minecraft_whitelist_requests
```

## minecraft_servers

```sql
id text primary key
name text not null
environment text not null default 'production'
enabled boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Initial seed:

```text
id: ivrm-craft
name: いゔる。ーむ くらふと
environment: production
enabled: true
```

## minecraft_accounts

```sql
id uuid primary key
minecraft_uuid text not null unique
minecraft_name text not null
discord_user_id text null
linked_at timestamptz null
verified_at timestamptz null
whitelisted_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## minecraft_event_logs

```sql
id uuid primary key
event_id text not null unique
server_id text not null references minecraft_servers(id)
event_type text not null
minecraft_uuid text not null
minecraft_name text not null
payload_json jsonb not null
received_at timestamptz not null default now()
```

`event_id` is the idempotency key. If the same event is resent, the API returns `duplicate: true` and does not run session side effects again.

## minecraft_sessions

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
minecraft_uuid text not null
minecraft_name text not null
joined_at timestamptz not null
left_at timestamptz null
last_seen_at timestamptz not null
total_seconds integer not null default 0
afk_seconds integer not null default 0
active_seconds integer not null default 0
status text not null default 'active'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Current statuses:

```text
active
closed
replaced
```

`replaced` is used when a new login arrives while an old active session remains open.

## minecraft_daily_stats

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
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

A closed session is split by Asia/Tokyo calendar day before being added to this table.

## minecraft_monthly_stats

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
minecraft_uuid text not null
year_month text not null
login_days integer not null default 0
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
unique(server_id, minecraft_uuid, year_month)
```

`login_days` increments only when the first daily row for a player/date is created.

## minecraft_reward_pools

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
pool_type text not null
name text not null
enabled boolean not null default true
timezone text not null default 'Asia/Tokyo'
reset_time text not null default '00:00'
draw_limit_per_day integer not null default 1
require_discord_link boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Initial daily random pool:

```text
server_id: ivrm-craft
pool_type: daily_random
require_discord_link: true
draw_limit_per_day: 1
```

## minecraft_reward_items

```sql
id uuid primary key
pool_id uuid not null references minecraft_reward_pools(id)
rarity text not null
weight integer not null
reward_name text not null
commands_json jsonb not null
enabled boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

MVP command allowlist is `give {player} ...` only.

## minecraft_reward_grants

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
minecraft_uuid text not null
reward_rule_id uuid null
reward_type text not null
reward_name text not null
status text not null default 'pending'
commands_json jsonb not null
granted_at timestamptz not null default now()
delivered_at timestamptz null
expires_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Daily random rewards create a `pending` grant. Delivery is handled by the claim/ack flow.

## minecraft_random_reward_draws

```sql
id uuid primary key
server_id text not null references minecraft_servers(id)
minecraft_uuid text not null
date date not null
pool_id uuid not null references minecraft_reward_pools(id)
reward_item_id uuid not null references minecraft_reward_items(id)
reward_grant_id uuid null references minecraft_reward_grants(id)
rarity text not null
reward_name text not null
probability numeric(6, 3) not null
status text not null default 'granted'
drawn_at timestamptz not null default now()
delivered_at timestamptz null
created_at timestamptz not null default now()
unique(server_id, minecraft_uuid, date)
```

## Aggregation behavior

```text
logout event
  -> close active session
  -> calculate total_seconds / active_seconds
  -> split session by Asia/Tokyo date
  -> upsert minecraft_daily_stats
  -> upsert minecraft_monthly_stats
```

## Daily random reward behavior

```text
draw request
  -> verify HMAC
  -> check Discord link
  -> check existing draw for Asia/Tokyo date
  -> select weighted reward item
  -> create random_reward_draw
  -> create pending reward_grant
  -> attach grant to draw
```

## Supabase notes

Use the Transaction pooler connection string for Cloud Run.

```env
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_DB_PASSWORD@aws-xxxx.pooler.supabase.com:6543/postgres
```

Postgres.js must disable prepared statements when using the transaction pooler.

```ts
postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: 'require',
});
```
