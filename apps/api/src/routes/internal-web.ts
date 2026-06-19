import { Hono } from 'hono';
import { z, ZodError } from 'zod';
import { getDatabase } from '../db/client.js';
import {
  getMinecraftMemberOverview,
  listMinecraftAdminPlayers,
  listMinecraftAdminRewards,
  listMinecraftMemberRewards,
} from '../repositories/minecraft-web-repository.js';

type Variables = {
  serverId: string;
};

export const internalWebRoutes = new Hono<{ Variables: Variables }>();

const DEFAULT_SERVER_ID = 'ivrm-craft';
const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

const rewardGrantStatusSchema = z.enum(['pending', 'delivered', 'expired', 'cancelled']);

const commonQuerySchema = z.object({
  serverId: z.string().min(1).optional(),
});

const overviewQuerySchema = commonQuerySchema.extend({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const listQuerySchema = commonQuerySchema.extend({
  status: rewardGrantStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

function getCurrentTokyoYearMonth() {
  return new Date(Date.now() + TOKYO_OFFSET_MS).toISOString().slice(0, 7);
}

function parseQuery(c: { req: { query(name: string): string | undefined } }) {
  return {
    serverId: c.req.query('serverId'),
    yearMonth: c.req.query('yearMonth'),
    status: c.req.query('status'),
    limit: c.req.query('limit'),
  };
}

internalWebRoutes.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json({ ok: false, error: 'invalid_query', issues: error.issues }, 400);
  }

  console.error(error);
  return c.json({ ok: false, error: 'internal_error' }, 500);
});

internalWebRoutes.use('/internal/*', async (c, next) => {
  const expectedSecret = process.env.IVRM_INTERNAL_API_SECRET;
  const providedSecret = c.req.header('X-IVRM-Internal-Secret');

  if (!expectedSecret) {
    return c.json({ ok: false, error: 'internal_api_secret_not_configured' }, 500);
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return c.json({ ok: false, error: 'unauthorized' }, 401);
  }

  await next();
});

internalWebRoutes.get('/internal/member/:minecraftUuid/overview', async (c) => {
  const minecraftUuid = z.string().uuid().parse(c.req.param('minecraftUuid'));
  const query = overviewQuerySchema.parse(parseQuery(c));
  const serverId = query.serverId ?? DEFAULT_SERVER_ID;
  const yearMonth = query.yearMonth ?? getCurrentTokyoYearMonth();

  const overview = await getMinecraftMemberOverview(getDatabase(), {
    serverId,
    minecraftUuid,
    yearMonth,
  });

  return c.json({ ok: true, serverId, minecraftUuid, yearMonth, ...overview });
});

internalWebRoutes.get('/internal/member/:minecraftUuid/rewards', async (c) => {
  const minecraftUuid = z.string().uuid().parse(c.req.param('minecraftUuid'));
  const query = listQuerySchema.parse(parseQuery(c));
  const serverId = query.serverId ?? DEFAULT_SERVER_ID;

  const rewards = await listMinecraftMemberRewards(getDatabase(), {
    serverId,
    minecraftUuid,
    status: query.status,
    limit: query.limit,
  });

  return c.json({ ok: true, serverId, minecraftUuid, rewards });
});

internalWebRoutes.get('/internal/admin/players', async (c) => {
  const query = listQuerySchema.omit({ status: true }).parse(parseQuery(c));
  const serverId = query.serverId ?? DEFAULT_SERVER_ID;

  const players = await listMinecraftAdminPlayers(getDatabase(), {
    serverId,
    limit: query.limit,
  });

  return c.json({ ok: true, serverId, players });
});

internalWebRoutes.get('/internal/admin/rewards', async (c) => {
  const query = listQuerySchema.parse(parseQuery(c));
  const serverId = query.serverId ?? DEFAULT_SERVER_ID;

  const rewards = await listMinecraftAdminRewards(getDatabase(), {
    serverId,
    status: query.status,
    limit: query.limit,
  });

  return c.json({ ok: true, serverId, rewards });
});
