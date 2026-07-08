import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { internalWebRoutes } from './routes/internal-web.js';
import { minecraftRoutes } from './routes/minecraft.js';
import { minecraftRewardRoutes } from './routes/minecraft-rewards.js';

const app = new Hono();
const healthResponse = { ok: true, service: 'ivrm-minecraft-activity-api' };

app.get('/', (c) => c.json(healthResponse));
app.get('/healthz', (c) => c.json(healthResponse));
app.get('/readyz', (c) => c.json(healthResponse));
app.get('/livez', (c) => c.json(healthResponse));
app.route('/v1/minecraft', internalWebRoutes);
app.route('/v1/minecraft', minecraftRewardRoutes);
app.route('/v1/minecraft', minecraftRoutes);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, () => {
  console.log(`IVRM Minecraft Activity API listening on :${port}`);
});
