import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { minecraftRoutes } from './routes/minecraft.js';
import { minecraftRewardRoutes } from './routes/minecraft-rewards.js';

const app = new Hono();

app.get('/healthz', (c) => c.json({ ok: true, service: 'ivrm-minecraft-activity-api' }));
app.route('/v1/minecraft', minecraftRoutes);
app.route('/v1/minecraft', minecraftRewardRoutes);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, () => {
  console.log(`IVRM Minecraft Activity API listening on :${port}`);
});
