import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { minecraftDailyStats } from '../db/schema.js';

export type IncrementDailyStatsInput = {
  serverId: string;
  minecraftUuid: string;
  date: string;
  loginCount: number;
  activeSeconds: number;
  afkSeconds: number;
};

export async function incrementMinecraftDailyStats(
  db: Database,
  input: IncrementDailyStatsInput,
): Promise<{ created: boolean }> {
  const [existing] = await db
    .select({ id: minecraftDailyStats.id })
    .from(minecraftDailyStats)
    .where(and(
      eq(minecraftDailyStats.serverId, input.serverId),
      eq(minecraftDailyStats.minecraftUuid, input.minecraftUuid),
      eq(minecraftDailyStats.date, input.date),
    ))
    .limit(1);

  await db
    .insert(minecraftDailyStats)
    .values({
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      date: input.date,
      loginCount: input.loginCount,
      activeSeconds: input.activeSeconds,
      afkSeconds: input.afkSeconds,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [minecraftDailyStats.serverId, minecraftDailyStats.minecraftUuid, minecraftDailyStats.date],
      set: {
        loginCount: sql`${minecraftDailyStats.loginCount} + ${input.loginCount}`,
        activeSeconds: sql`${minecraftDailyStats.activeSeconds} + ${input.activeSeconds}`,
        afkSeconds: sql`${minecraftDailyStats.afkSeconds} + ${input.afkSeconds}`,
        updatedAt: new Date(),
      },
    });

  return { created: !existing };
}
