import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import {
  minecraftAccounts,
  minecraftMonthlyStats,
  minecraftRandomRewardDraws,
  minecraftRewardGrants,
  minecraftSessions,
} from '../db/schema.js';

export type RewardGrantStatus = 'pending' | 'delivered' | 'expired' | 'cancelled';

export async function getMinecraftMemberOverview(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  yearMonth: string;
}) {
  const [account] = await db
    .select({
      minecraftUuid: minecraftAccounts.minecraftUuid,
      minecraftName: minecraftAccounts.minecraftName,
      discordUserId: minecraftAccounts.discordUserId,
      linkedAt: minecraftAccounts.linkedAt,
      verifiedAt: minecraftAccounts.verifiedAt,
      whitelistedAt: minecraftAccounts.whitelistedAt,
      updatedAt: minecraftAccounts.updatedAt,
    })
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.minecraftUuid, input.minecraftUuid))
    .limit(1);

  const [monthly] = await db
    .select({
      yearMonth: minecraftMonthlyStats.yearMonth,
      loginDays: minecraftMonthlyStats.loginDays,
      loginCount: minecraftMonthlyStats.loginCount,
      activeSeconds: minecraftMonthlyStats.activeSeconds,
      afkSeconds: minecraftMonthlyStats.afkSeconds,
      deathCount: minecraftMonthlyStats.deathCount,
      chatCount: minecraftMonthlyStats.chatCount,
      blockPlaceCount: minecraftMonthlyStats.blockPlaceCount,
      blockBreakCount: minecraftMonthlyStats.blockBreakCount,
      advancementCount: minecraftMonthlyStats.advancementCount,
      updatedAt: minecraftMonthlyStats.updatedAt,
    })
    .from(minecraftMonthlyStats)
    .where(and(
      eq(minecraftMonthlyStats.serverId, input.serverId),
      eq(minecraftMonthlyStats.minecraftUuid, input.minecraftUuid),
      eq(minecraftMonthlyStats.yearMonth, input.yearMonth),
    ))
    .limit(1);

  const recentRewards = await listMinecraftMemberRewards(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    limit: 10,
  });

  const recentDraws = await db
    .select({
      id: minecraftRandomRewardDraws.id,
      date: minecraftRandomRewardDraws.date,
      rarity: minecraftRandomRewardDraws.rarity,
      rewardName: minecraftRandomRewardDraws.rewardName,
      probability: minecraftRandomRewardDraws.probability,
      status: minecraftRandomRewardDraws.status,
      drawnAt: minecraftRandomRewardDraws.drawnAt,
      deliveredAt: minecraftRandomRewardDraws.deliveredAt,
    })
    .from(minecraftRandomRewardDraws)
    .where(and(
      eq(minecraftRandomRewardDraws.serverId, input.serverId),
      eq(minecraftRandomRewardDraws.minecraftUuid, input.minecraftUuid),
    ))
    .orderBy(desc(minecraftRandomRewardDraws.drawnAt))
    .limit(10);

  return {
    account: account
      ? {
        ...account,
        discordLinked: Boolean(account.discordUserId),
      }
      : null,
    monthly: monthly ?? null,
    recentRewards,
    recentDraws,
  };
}

export async function listMinecraftMemberRewards(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  status?: RewardGrantStatus;
  limit?: number;
}) {
  const conditions = [
    eq(minecraftRewardGrants.serverId, input.serverId),
    eq(minecraftRewardGrants.minecraftUuid, input.minecraftUuid),
  ];

  if (input.status) {
    conditions.push(eq(minecraftRewardGrants.status, input.status));
  }

  return db
    .select({
      id: minecraftRewardGrants.id,
      rewardType: minecraftRewardGrants.rewardType,
      rewardName: minecraftRewardGrants.rewardName,
      status: minecraftRewardGrants.status,
      grantedAt: minecraftRewardGrants.grantedAt,
      deliveredAt: minecraftRewardGrants.deliveredAt,
      expiresAt: minecraftRewardGrants.expiresAt,
    })
    .from(minecraftRewardGrants)
    .where(and(...conditions))
    .orderBy(desc(minecraftRewardGrants.grantedAt))
    .limit(input.limit ?? 50);
}

export async function listMinecraftAdminPlayers(db: Database, input: {
  serverId: string;
  limit?: number;
}) {
  return db
    .select({
      minecraftUuid: minecraftAccounts.minecraftUuid,
      minecraftName: minecraftAccounts.minecraftName,
      discordUserId: minecraftAccounts.discordUserId,
      linkedAt: minecraftAccounts.linkedAt,
      verifiedAt: minecraftAccounts.verifiedAt,
      whitelistedAt: minecraftAccounts.whitelistedAt,
      updatedAt: minecraftAccounts.updatedAt,
      totalSessions: sql<number>`count(${minecraftSessions.id})::int`,
      lastSeenAt: sql<Date | null>`max(${minecraftSessions.lastSeenAt})`,
    })
    .from(minecraftAccounts)
    .leftJoin(minecraftSessions, and(
      eq(minecraftSessions.minecraftUuid, minecraftAccounts.minecraftUuid),
      eq(minecraftSessions.serverId, input.serverId),
    ))
    .groupBy(
      minecraftAccounts.minecraftUuid,
      minecraftAccounts.minecraftName,
      minecraftAccounts.discordUserId,
      minecraftAccounts.linkedAt,
      minecraftAccounts.verifiedAt,
      minecraftAccounts.whitelistedAt,
      minecraftAccounts.updatedAt,
    )
    .orderBy(desc(sql`max(${minecraftSessions.lastSeenAt})`), desc(minecraftAccounts.updatedAt))
    .limit(input.limit ?? 100);
}

export async function listMinecraftAdminRewards(db: Database, input: {
  serverId: string;
  status?: RewardGrantStatus;
  limit?: number;
}) {
  const conditions = [eq(minecraftRewardGrants.serverId, input.serverId)];

  if (input.status) {
    conditions.push(eq(minecraftRewardGrants.status, input.status));
  }

  return db
    .select({
      id: minecraftRewardGrants.id,
      minecraftUuid: minecraftRewardGrants.minecraftUuid,
      rewardType: minecraftRewardGrants.rewardType,
      rewardName: minecraftRewardGrants.rewardName,
      status: minecraftRewardGrants.status,
      grantedAt: minecraftRewardGrants.grantedAt,
      deliveredAt: minecraftRewardGrants.deliveredAt,
      expiresAt: minecraftRewardGrants.expiresAt,
    })
    .from(minecraftRewardGrants)
    .where(and(...conditions))
    .orderBy(desc(minecraftRewardGrants.grantedAt))
    .limit(input.limit ?? 100);
}
