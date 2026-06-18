import {
  boolean,
  date as pgDate,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
};

const statCounters = {
  loginCount: integer('login_count').notNull().default(0),
  activeSeconds: integer('active_seconds').notNull().default(0),
  afkSeconds: integer('afk_seconds').notNull().default(0),
  deathCount: integer('death_count').notNull().default(0),
  chatCount: integer('chat_count').notNull().default(0),
  blockPlaceCount: integer('block_place_count').notNull().default(0),
  blockBreakCount: integer('block_break_count').notNull().default(0),
  advancementCount: integer('advancement_count').notNull().default(0),
};

export const minecraftServers = pgTable('minecraft_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  environment: text('environment').notNull().default('production'),
  enabled: boolean('enabled').notNull().default(true),
  ...timestamps,
});

export const minecraftAccounts = pgTable('minecraft_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  minecraftUuid: text('minecraft_uuid').notNull(),
  minecraftName: text('minecraft_name').notNull(),
  discordUserId: text('discord_user_id'),
  linkedAt: timestamp('linked_at', { withTimezone: true, mode: 'date' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'date' }),
  whitelistedAt: timestamp('whitelisted_at', { withTimezone: true, mode: 'date' }),
  ...timestamps,
}, (table) => ({
  minecraftUuidUnique: uniqueIndex('minecraft_accounts_minecraft_uuid_unique').on(table.minecraftUuid),
}));

export const minecraftEventLogs = pgTable('minecraft_event_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  serverId: text('server_id').notNull().references(() => minecraftServers.id),
  eventType: text('event_type').notNull(),
  minecraftUuid: text('minecraft_uuid').notNull(),
  minecraftName: text('minecraft_name').notNull(),
  payloadJson: jsonb('payload_json').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  eventIdUnique: uniqueIndex('minecraft_event_logs_event_id_unique').on(table.eventId),
  serverReceivedAtIdx: index('idx_minecraft_event_logs_server_received_at').on(table.serverId, table.receivedAt.desc()),
  eventTypeIdx: index('idx_minecraft_event_logs_event_type').on(table.eventType),
}));

export const minecraftSessions = pgTable('minecraft_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  serverId: text('server_id').notNull().references(() => minecraftServers.id),
  minecraftUuid: text('minecraft_uuid').notNull(),
  minecraftName: text('minecraft_name').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).notNull(),
  leftAt: timestamp('left_at', { withTimezone: true, mode: 'date' }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }).notNull(),
  totalSeconds: integer('total_seconds').notNull().default(0),
  afkSeconds: integer('afk_seconds').notNull().default(0),
  activeSeconds: integer('active_seconds').notNull().default(0),
  status: text('status').notNull().default('active'),
  ...timestamps,
}, (table) => ({
  activeIdx: index('idx_minecraft_sessions_active').on(table.serverId, table.minecraftUuid, table.status),
  uuidJoinedAtIdx: index('idx_minecraft_sessions_uuid_joined_at').on(table.minecraftUuid, table.joinedAt.desc()),
}));

export const minecraftSessionHeartbeats = pgTable('minecraft_session_heartbeats', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => minecraftSessions.id, { onDelete: 'cascade' }),
  serverId: text('server_id').notNull().references(() => minecraftServers.id),
  minecraftUuid: text('minecraft_uuid').notNull(),
  dimension: text('dimension'),
  afk: boolean('afk').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  sessionSentAtIdx: index('idx_minecraft_heartbeats_session_sent_at').on(table.sessionId, table.sentAt.desc()),
  serverIdIdx: index('idx_minecraft_heartbeats_server_id').on(table.serverId),
}));

export const minecraftDailyStats = pgTable('minecraft_daily_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  serverId: text('server_id').notNull().references(() => minecraftServers.id),
  minecraftUuid: text('minecraft_uuid').notNull(),
  date: pgDate('date', { mode: 'string' }).notNull(),
  ...statCounters,
  ...timestamps,
}, (table) => ({
  uniqueDailyPlayer: uniqueIndex('minecraft_daily_stats_server_uuid_date_unique').on(
    table.serverId,
    table.minecraftUuid,
    table.date,
  ),
  serverDateActiveIdx: index('idx_minecraft_daily_stats_server_date_active').on(
    table.serverId,
    table.date,
    table.activeSeconds,
  ),
  uuidDateIdx: index('idx_minecraft_daily_stats_uuid_date').on(table.minecraftUuid, table.date),
}));

export const minecraftMonthlyStats = pgTable('minecraft_monthly_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  serverId: text('server_id').notNull().references(() => minecraftServers.id),
  minecraftUuid: text('minecraft_uuid').notNull(),
  yearMonth: text('year_month').notNull(),
  loginDays: integer('login_days').notNull().default(0),
  ...statCounters,
  ...timestamps,
}, (table) => ({
  uniqueMonthlyPlayer: uniqueIndex('minecraft_monthly_stats_server_uuid_month_unique').on(
    table.serverId,
    table.minecraftUuid,
    table.yearMonth,
  ),
  serverMonthActiveIdx: index('idx_minecraft_monthly_stats_server_month_active').on(
    table.serverId,
    table.yearMonth,
    table.activeSeconds,
  ),
  uuidMonthIdx: index('idx_minecraft_monthly_stats_uuid_month').on(table.minecraftUuid, table.yearMonth),
}));
