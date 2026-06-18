import { sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { minecraftMonthlyStats } from '../db/schema.js';

export type IncrementMonthlyStatsInput = {
  serverId: string;
  minecraftUuid: string;
  yearMonth: string;
  loginDays: number;
  loginCount: number;
  activeSeconds: number;
  afkSeconds: number;
};

export async function incrementMinecraftMonthlyStats(db: Database, input: IncrementMonthlyStatsInput) {
  await db
    .insert(minecraftMonthlyStats)
    .values({
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      yearMonth: input.yearMonth,
      loginDays: input.loginDays,
      loginCount: input.loginCount,
      activeSeconds: input.activeSeconds,
      afkSeconds: input.afkSeconds,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [minecraftMonthlyStats.serverId, minecraftMonthlyStats.minecraftUuid, minecraftMonthlyStats.yearMonth],
      set: {
        loginDays: sql`${minecraftMonthlyStats.loginDays} + ${input.loginDays}`,
        loginCount: sql`${minecraftMonthlyStats.loginCount} + ${input.loginCount}`,
        activeSeconds: sql`${minecraftMonthlyStats.activeSeconds} + ${input.activeSeconds}`,
        afkSeconds: sql`${minecraftMonthlyStats.afkSeconds} + ${input.afkSeconds}`,
        updatedAt: new Date(),
      },
    });
}
