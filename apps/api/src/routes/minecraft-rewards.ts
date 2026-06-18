import { Hono } from 'hono';
import { z, ZodError } from 'zod';
import { getDatabase } from '../db/client.js';
import { createSignature, isFreshTimestamp, safeEqualHex } from '../security.js';
import { ackRewardDelivery, listPendingRewards } from '../services/minecraft-reward-claim-service.js';

type Variables = {
  rawBody: string;
  eventId: string;
  serverId: string;
};

export const minecraftRewardRoutes = new Hono<{ Variables: Variables }>();

const pendingRewardsQuerySchema = z.object({
  uuid: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const rewardAckSchema = z.object({
  serverId: z.string().min(1),
  minecraftUuid: z.string().uuid(),
  rewardGrantId: z.string().uuid(),
  deliveryStatus: z.literal('delivered'),
  deliveredAt: z.string().datetime({ offset: true }).optional(),
});

function parseEventTime(value: string | undefined, fallback = new Date()): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function parsePayload<T>(rawBody: string, schema: z.ZodType<T>): T {
  return schema.parse(JSON.parse(rawBody));
}

function validatePayloadServer(payloadServerId: string, headerServerId: string) {
  if (payloadServerId !== headerServerId) {
    throw new Error('server_id_mismatch');
  }
}

minecraftRewardRoutes.onError((error, c) => {
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

minecraftRewardRoutes.use('/rewards/*', async (c, next) => {
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

minecraftRewardRoutes.get('/rewards/pending', async (c) => {
  const serverId = c.get('serverId');
  const query = pendingRewardsQuerySchema.parse({
    uuid: c.req.query('uuid'),
    limit: c.req.query('limit'),
  });

  const rewards = await listPendingRewards(getDatabase(), {
    serverId,
    minecraftUuid: query.uuid,
    limit: query.limit,
  });

  return c.json({ ok: true, rewards });
});

minecraftRewardRoutes.post('/rewards/ack', async (c) => {
  const payload = parsePayload(c.get('rawBody'), rewardAckSchema);
  const serverId = c.get('serverId');
  validatePayloadServer(payload.serverId, serverId);

  const result = await ackRewardDelivery(getDatabase(), {
    serverId,
    minecraftUuid: payload.minecraftUuid,
    rewardGrantId: payload.rewardGrantId,
    deliveryStatus: payload.deliveryStatus,
    deliveredAt: parseEventTime(payload.deliveredAt),
  });

  if (!result.ok) {
    const status = result.error === 'reward_grant_not_found' ? 404 : 409;
    return c.json(result, status);
  }

  return c.json(result);
});
