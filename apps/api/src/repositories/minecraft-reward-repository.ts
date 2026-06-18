import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import {
  minecraftRandomRewardDraws,
  minecraftRewardGrants,
  minecraftRewardItems,
  minecraftRewardPools,
} from '../db/schema.js';

export async function findDailyRewardPool(db: Database, serverId: string) {
  const [pool] = await db
    .select()
    .from(minecraftRewardPools)
    .where(and(
      eq(minecraftRewardPools.serverId, serverId),
      eq(minecraftRewardPools.poolType, 'daily_random'),
      eq(minecraftRewardPools.enabled, true),
    ))
    .limit(1);

  return pool ?? null;
}

export async function listEnabledRewardItems(db: Database, poolId: string) {
  return db
    .select()
    .from(minecraftRewardItems)
    .where(and(
      eq(minecraftRewardItems.poolId, poolId),
      eq(minecraftRewardItems.enabled, true),
    ));
}

export async function findDailyRandomRewardDraw(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  date: string;
}) {
  const [draw] = await db
    .select()
    .from(minecraftRandomRewardDraws)
    .where(and(
      eq(minecraftRandomRewardDraws.serverId, input.serverId),
      eq(minecraftRandomRewardDraws.minecraftUuid, input.minecraftUuid),
      eq(minecraftRandomRewardDraws.date, input.date),
    ))
    .limit(1);

  return draw ?? null;
}

export async function createRewardGrant(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  rewardType: string;
  rewardName: string;
  commandsJson: unknown;
}) {
  const [grant] = await db
    .insert(minecraftRewardGrants)
    .values({
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      rewardType: input.rewardType,
      rewardName: input.rewardName,
      commandsJson: input.commandsJson,
      status: 'pending',
      updatedAt: new Date(),
    })
    .returning({ id: minecraftRewardGrants.id });

  return grant;
}

export async function createDailyRandomRewardDraw(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  date: string;
  poolId: string;
  rewardItemId: string;
  rarity: string;
  rewardName: string;
  probability: string;
}) {
  const [draw] = await db
    .insert(minecraftRandomRewardDraws)
    .values({
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      date: input.date,
      poolId: input.poolId,
      rewardItemId: input.rewardItemId,
      rarity: input.rarity,
      rewardName: input.rewardName,
      probability: input.probability,
      status: 'drawn',
    })
    .onConflictDoNothing({
      target: [
        minecraftRandomRewardDraws.serverId,
        minecraftRandomRewardDraws.minecraftUuid,
        minecraftRandomRewardDraws.date,
      ],
    })
    .returning({
      id: minecraftRandomRewardDraws.id,
      rewardGrantId: minecraftRandomRewardDraws.rewardGrantId,
      rarity: minecraftRandomRewardDraws.rarity,
      rewardName: minecraftRandomRewardDraws.rewardName,
      probability: minecraftRandomRewardDraws.probability,
      status: minecraftRandomRewardDraws.status,
    });

  return draw ?? null;
}

export async function attachRewardGrantToRandomRewardDraw(db: Database, input: {
  drawId: string;
  rewardGrantId: string;
}) {
  const [draw] = await db
    .update(minecraftRandomRewardDraws)
    .set({
      rewardGrantId: input.rewardGrantId,
      status: 'granted',
    })
    .where(eq(minecraftRandomRewardDraws.id, input.drawId))
    .returning({
      id: minecraftRandomRewardDraws.id,
      rewardGrantId: minecraftRandomRewardDraws.rewardGrantId,
      rarity: minecraftRandomRewardDraws.rarity,
      rewardName: minecraftRandomRewardDraws.rewardName,
      probability: minecraftRandomRewardDraws.probability,
      status: minecraftRandomRewardDraws.status,
    });

  return draw;
}
