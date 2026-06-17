import { Hono } from 'hono';
import { z } from 'zod';
import { createSignature, isFreshTimestamp, safeEqualHex } from '../security.js';

export const minecraftRoutes = new Hono();

const playerEventSchema = z.object({
  serverId: z.string().min(1),
  minecraftUuid: z.string().uuid(),
  minecraftName: z.string().min(1),
}).passthrough();

minecraftRoutes.use('*', async (c, next) => {
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

  const secret = process.env[`IVRM_SERVER_SECRET_${serverId.replaceAll('-', '_').toUpperCase()}`] ?? process.env.IVRM_SERVER_SECRET;
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

minecraftRoutes.post('/events/login', async (c) => {
  const payload = playerEventSchema.parse(JSON.parse(c.get('rawBody')));
  return c.json({ ok: true, type: 'login', sessionId: `sess_${c.get('eventId')}`, payload });
});

minecraftRoutes.post('/events/logout', async (c) => {
  const payload = playerEventSchema.parse(JSON.parse(c.get('rawBody')));
  return c.json({ ok: true, type: 'logout', payload });
});

minecraftRoutes.post('/events/heartbeat', async (c) => {
  const payload = playerEventSchema.parse(JSON.parse(c.get('rawBody')));
  return c.json({ ok: true, type: 'heartbeat', payload });
});

minecraftRoutes.post('/events/afk', async (c) => {
  const payload = playerEventSchema.parse(JSON.parse(c.get('rawBody')));
  return c.json({ ok: true, type: 'afk', payload });
});

minecraftRoutes.post('/events/player-stat', async (c) => {
  const payload = playerEventSchema.parse(JSON.parse(c.get('rawBody')));
  return c.json({ ok: true, type: 'player-stat', payload });
});
