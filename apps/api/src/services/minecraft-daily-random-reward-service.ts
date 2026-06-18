import type { Database } from '../db/client.js';
import { getMinecraftAccount } from '../repositories/minecraft-account-repository.js';
import {
  createDailyRandomRewardDraw,
  createRewardGrant,
  findDailyRandomRewardDraw,
  findDailyRewardPool,
  listEnabledRewardItems,
} from '../repositories/minecraft-reward-repository.js';

const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

type DrawDailyRandomRewardInput = {
  serverId: string;
  minecraftUuid: string;
  minecraftName: string;
  now?: Date;
};

function toTokyoDateKey(date: Date): string {
  return new Date(date.getTime() + TOKYO_OFFSET_MS).toISOString().slice(0, 10);
}

function isAllowedRewardCommands(commandsJson: unknown): commandsJson is string[] {
  return Array.isArray(commandsJson)
    && commandsJson.length > 0
    && commandsJson.every((command) => typeof command === 'string' && command.startsWith('give {player} '));
}

function chooseWeightedItem<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);

  if (totalWeight <= 0) {
    throw new Error('daily_random_reward_items_not_configured');
  }

  let cursor = Math.random() * totalWeight;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

export async function drawDailyRandomReward(db: Database, input: DrawDailyRandomRewardInput) {
  const drawDate = toTokyoDateKey(input.now ?? new Date());
  const existingDraw = await findDailyRandomRewardDraw(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    date: drawDate,
  });

  if (existingDraw) {
    return {
      ok: true,
      alreadyDrawn: true,
      drawDate,
      reward: {
        rarity: existingDraw.rarity,
        rewardName: existingDraw.rewardName,
        probability: existingDraw.probability,
        status: existingDraw.status,
      },
    };
  }

  const account = await getMinecraftAccount(db, input.minecraftUuid);
  const pool = await findDailyRewardPool(db, input.serverId);

  if (!pool) {
    return { ok: false, error: 'daily_random_reward_pool_not_configured', drawDate };
  }

  if (pool.requireDiscordLink && !account?.discordUserId) {
    return { ok: false, error: 'discord_link_required', drawDate };
  }

  const items = await listEnabledRewardItems(db, pool.id);
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);

  if (items.length === 0 || totalWeight <= 0) {
    return { ok: false, error: 'daily_random_reward_items_not_configured', drawDate };
  }

  const selectedItem = chooseWeightedItem(items);
  const probability = ((selectedItem.weight / totalWeight) * 100).toFixed(3);

  if (!isAllowedRewardCommands(selectedItem.commandsJson)) {
    return { ok: false, error: 'reward_command_not_allowed', drawDate };
  }

  const grant = await createRewardGrant(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    rewardType: 'daily_random',
    rewardName: selectedItem.rewardName,
    commandsJson: selectedItem.commandsJson,
  });

  const draw = await createDailyRandomRewardDraw(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    date: drawDate,
    poolId: pool.id,
    rewardItemId: selectedItem.id,
    rewardGrantId: grant.id,
    rarity: selectedItem.rarity,
    rewardName: selectedItem.rewardName,
    probability,
  });

  if (!draw) {
    const raceDraw = await findDailyRandomRewardDraw(db, {
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      date: drawDate,
    });

    return {
      ok: true,
      alreadyDrawn: true,
      drawDate,
      reward: raceDraw
        ? {
          rarity: raceDraw.rarity,
          rewardName: raceDraw.rewardName,
          probability: raceDraw.probability,
          status: raceDraw.status,
        }
        : null,
    };
  }

  return {
    ok: true,
    alreadyDrawn: false,
    drawDate,
    rewardGrantId: grant.id,
    reward: {
      rarity: draw.rarity,
      rewardName: draw.rewardName,
      probability: draw.probability,
      status: draw.status,
    },
  };
}
