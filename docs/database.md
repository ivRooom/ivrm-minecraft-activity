# Database Design

## Policy

- Minecraft account identity uses UUID as the stable key.
- Minecraft name is display-only and can change.
- Raw event logs are retained for a limited period.
- Aggregated daily/monthly stats are retained long term.
- Reward grants must be idempotent.
- Browser clients do not connect to Supabase directly for this feature. `api.ivrm.jp` connects to PostgreSQL with `DATABASE_URL`.
- Tables in `public` must have RLS enabled and no public policies until a direct Data API use case is explicitly designed.

## MVP tables

The first persistence milestone stores signed Minecraft events, session state, and activity aggregates.

```text
minecraft_servers
minecraft_accounts
minecraft_event_logs
minecraft_sessions
minecraft_session_heartbeats
minecraft_daily_stats
minecraft_monthly_stats
```

## Core tables planned later

```text
users
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

## minecraft_session_heartbeats

```sql
id uuid primary key
session_id uuid null references minecraft_sessions(id) on delete cascade
server_id text not null references minecraft_servers(id)
minecraft_uuid text not null
dimension text null
afk boolean not null default false
sent_at timestamptz not null
created_at timestamptz not null default now()
```

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

## Aggregation behavior

```text
logout event
  -> close active session
  -> calculate total_seconds / active_seconds
  -> split session by Asia/Tokyo date
  -> upsert minecraft_daily_stats
  -> upsert minecraft_monthly_stats
```

Example:

```text
login:  2026-06-17 23:30 Asia/Tokyo
logout: 2026-06-18 01:30 Asia/Tokyo

minecraft_daily_stats:
2026-06-17: 30 minutes
2026-06-18: 90 minutes
```

## Important indexes

```sql
create unique index minecraft_accounts_minecraft_uuid_unique on minecraft_accounts(minecraft_uuid);
create unique index minecraft_event_logs_event_id_unique on minecraft_event_logs(event_id);
create index idx_minecraft_event_logs_server_received_at on minecraft_event_logs(server_id, received_at desc);
create index idx_minecraft_event_logs_event_type on minecraft_event_logs(event_type);
create index idx_minecraft_sessions_active on minecraft_sessions(server_id, minecraft_uuid, status) where status = 'active';
create index idx_minecraft_sessions_uuid_joined_at on minecraft_sessions(minecraft_uuid, joined_at desc);
create index idx_minecraft_heartbeats_session_sent_at on minecraft_session_heartbeats(session_id, sent_at desc);
create index idx_minecraft_heartbeats_server_id on minecraft_session_heartbeats(server_id);
create unique index minecraft_daily_stats_server_uuid_date_unique on minecraft_daily_stats(server_id, minecraft_uuid, date);
create index idx_minecraft_daily_stats_server_date_active on minecraft_daily_stats(server_id, date, active_seconds);
create index idx_minecraft_daily_stats_uuid_date on minecraft_daily_stats(minecraft_uuid, date);
create unique index minecraft_monthly_stats_server_uuid_month_unique on minecraft_monthly_stats(server_id, minecraft_uuid, year_month);
create index idx_minecraft_monthly_stats_server_month_active on minecraft_monthly_stats(server_id, year_month, active_seconds);
create index idx_minecraft_monthly_stats_uuid_month on minecraft_monthly_stats(minecraft_uuid, year_month);
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
