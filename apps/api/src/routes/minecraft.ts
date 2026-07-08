import { Hono } from 'hono';
import { z, ZodError } from 'zod';
import { getDatabase } from '../db/client.js';
import { upsertMinecraftAccount } from '../repositories/minecraft-account-repository.js';
import { createMinecraftEventLog, type MinecraftEventType } from '../repositories/minecraft-event-log-repository.js';
import {
  closeMinecraftSession,
  openMinecraftSession,
  recordMinecraftHeartbeat,
} from '../repositories/minecraft-session-repository.js';
import { createSignature, isFreshTimestamp, safeEqualHex } from '../security.js';
import { aggregateClosedMinecraftSession } from '../services/minecraft-activity-aggregation-service.js';
import { drawDailyRandomReward } from '../services/minecraft-daily-random-reward-service.js';

type Variables = {
  rawBody: string;
  eventId: string;
  serverId: string;
};

export const minecraftRoutes = new Hono<{ Variables: Variables }>();

const playerEventSchema = z.object({
  serverId: z.string().min(1),
  minecraftUuid: z.string().uuid(),
  minecraftName: z.string().min(1),
}).passthrough();

const loginEventSchema = playerEventSchema.extend({
  joinedAt: z.string().datetime({ offset: true }).optional(),
});

const logoutEventSchema = playerEventSchema.extend({
  leftAt: z.string().datetime({ offset: true }).optional(),
});

const heartbeatEventSchema = playerEventSchema.extend({
  sentAt: z.string().datetime({ offset: true }).optional(),
  dimension: z.string().min(1).optional(),
  afk: z.boolean().optional(),
});

function parseEventTime(value: string | undefined, fallback = new Date()): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

function parsePayload<T>(rawBody: string, schema: z.ZodType<T>): T {
  return schema.parse(JSON.parse(rawBody));
}

function validatePayloadServer(payloadServerId: string, headerServerId: string) {
  if (payloadServerId !== headerServerId) {
    throw new Error('server_id_mismatch');
  }
}

async function persistEvent(options: {
  eventType: MinecraftEventType;
  eventId: string;
  serverId: string;
  minecraftUuid: string;
  minecraftName: string;
  payload: unknown;
}) {
  const db = getDatabase();
  const result = await createMinecraftEventLog(db, {
    eventId: options.eventId,
    serverId: options.serverId,
    eventType: options.eventType,
    minecraftUuid: options.minecraftUuid,
    minecraftName: options.minecraftName,
    payloadJson: options.payload,
  });

  if (!result.inserted) {
    return { db, duplicate: true };
  }

  await upsertMinecraftAccount(db, {
    minecraftUuid: options.minecraftUuid,
    minecraftName: options.minecraftName,
  });

  return { db, duplicate: false };
}

minecraftRoutes.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json({ ok: false, error: 'invalid_payload', issues: error.issues }, 400);
  }

  if (error instanceof SyntaxError) {
    return c.json({ ok: false, error: 'invalid_json' }, 400);
  }

  if (error instanceof Error && error.message === 'server_id_mismatch') {
    return c.json({ ok: false, error: 'server_id_mismatch' }, 400);
  }

  console.error(error);
  return c.json({ ok: false, error: 'internal_error' }, 500);
});

const hmacProtectedPaths = ['/events/*', '/rewards/daily-random/*'];

for (const path of hmacProtectedPaths) {
  minecraftRoutes.use(path, async (c, next) => {
    const serverId = c.req.header('X-IVRM-Server-Id');
    const timestamp = c.req.header('X-IVRM-Timestamp');
    const eventId = c.req.header('X-IVRM-Event-Id');
    const signature = c.req.header('X-IVRM-Signature');

    if (!serverId || !timestamp || !eventId || !signature) {
      return c.json({ ok: false, error: 'missing_signature_headers' }, 401);
    }

    if (!isFreshTimestamp(timestamp)) {
      return c.json({ ok: false, error: 'stale_timestamp' }, 401);
    }

    const body = await c.req.text();
    c.set('rawBody', body);
    c.set('eventId', eventId);
    c.set('serverId', serverId);

    const serverSecretName = `IVRM_SERVER_SECRET_${serverId.replaceAll('-', '_').toUpperCase()}`;
    const secret = process.env[serverSecretName] ?? process.env.IVRM_SERVER_SECRET;
    if (!secret) {
      return c.json({ ok: false, error: 'server_secret_not_configured' }, 500);
    }

    const expected = createSignature({
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      timestamp,
      eventId,
      body,
      secret,
    });

    if (!safeEqualHex(expected, signature)) {
      return c.json({ ok: false, error: 'invalid_signature' }, 401);
    }

    await next();
  });
}

minecraftRoutes.post('/events/login', async (c) => {
  const payload = parsePayload(c.get('rawBody'), loginEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const { db, duplicate } = await persistEvent({
    eventType: 'login',
    eventId: c.get('eventId'),
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    payload,
  });

  if (duplicate) {
    return c.json({ ok: true, type: 'login', duplicate: true });
  }

  const session = await openMinecraftSession(db, {
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    joinedAt: parseEventTime(payload.joinedAt),
  });

  return c.json({ ok: true, type: 'login', sessionId: session.id, duplicate: false });
});

minecraftRoutes.post('/events/logout', async (c) => {
  const payload = parsePayload(c.get('rawBody'), logoutEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const { db, duplicate } = await persistEvent({
    eventType: 'logout',
    eventId: c.get('eventId'),
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    payload,
  });

  if (duplicate) {
    return c.json({ ok: true, type: 'logout', duplicate: true });
  }

  const session = await closeMinecraftSession(db, {
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    leftAt: parseEventTime(payload.leftAt),
  });
  const aggregation = session?.leftAt
    ? await aggregateClosedMinecraftSession(db, {
      serverId: session.serverId,
      minecraftUuid: session.minecraftUuid,
      joinedAt: session.joinedAt,
      leftAt: session.leftAt,
      totalSeconds: session.totalSeconds,
      activeSeconds: session.activeSeconds,
      afkSeconds: session.afkSeconds,
    })
    : null;

  return c.json({ ok: true, type: 'logout', session, aggregation, duplicate: false });
});

minecraftRoutes.post('/events/heartbeat', async (c) => {
  const payload = parsePayload(c.get('rawBody'), heartbeatEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const { db, duplicate } = await persistEvent({
    eventType: 'heartbeat',
    eventId: c.get('eventId'),
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    payload,
  });

  if (duplicate) {
    return c.json({ ok: true, type: 'heartbeat', duplicate: true });
  }

  const heartbeat = await recordMinecraftHeartbeat(db, {
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    sentAt: parseEventTime(payload.sentAt),
    dimension: payload.dimension,
    afk: payload.afk ?? false,
  });

  return c.json({ ok: true, type: 'heartbeat', heartbeat, duplicate: false });
});

minecraftRoutes.post('/events/afk', async (c) => {
  const payload = parsePayload(c.get('rawBody'), playerEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const { duplicate } = await persistEvent({
    eventType: 'afk',
    eventId: c.get('eventId'),
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    payload,
  });

  return c.json({ ok: true, type: 'afk', duplicate });
});

minecraftRoutes.post('/events/player-stat', async (c) => {
  const payload = parsePayload(c.get('rawBody'), playerEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const { duplicate } = await persistEvent({
    eventType: 'player-stat',
    eventId: c.get('eventId'),
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
    payload,
  });

  return c.json({ ok: true, type: 'player-stat', duplicate });
});

minecraftRoutes.post('/rewards/daily-random/draw', async (c) => {
  const payload = parsePayload(c.get('rawBody'), playerEventSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const result = await drawDailyRandomReward(getDatabase(), {
    serverId,
    minecraftUuid: payload.minecraftUuid,
    minecraftName: payload.minecraftName,
  });

  if (!result.ok) {
    const status = result.error === 'discord_link_required' ? 403 : 400;
    return c.json(result, status);
  }

  return c.json(result);
});
