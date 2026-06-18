import type { Database } from '../db/client.js';
import {
  findRewardGrantForPlayer,
  listPendingRewardGrants,
  markRewardGrantDelivered,
} from '../repositories/minecraft-reward-repository.js';

const ALLOWED_REWARD_COMMAND_PREFIXES = [
  'give {player} ',
];

type RewardGrantAckSuccess = {
  ok: true;
  delivered: true;
  alreadyDelivered: boolean;
  rewardGrant: unknown;
};

type RewardGrantAckFailure = {
  ok: false;
  error: 'reward_grant_not_found' | 'reward_grant_not_pending';
  status?: string;
};

type RewardGrantAckResult = RewardGrantAckSuccess | RewardGrantAckFailure;

function normalizeRewardCommands(commandsJson: unknown): string[] {
  if (!Array.isArray(commandsJson)) {
    return [];
  }

  return commandsJson.filter((command): command is string => {
    if (typeof command !== 'string') {
      return false;
    }

    return ALLOWED_REWARD_COMMAND_PREFIXES.some((prefix) => command.startsWith(prefix));
  });
}

export async function listPendingRewards(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  limit?: number;
}) {
  const grants = await listPendingRewardGrants(db, input);

  return grants
    .map((grant) => ({
      id: grant.id,
      rewardType: grant.rewardType,
      rewardName: grant.rewardName,
      commands: normalizeRewardCommands(grant.commandsJson),
      grantedAt: grant.grantedAt.toISOString(),
      expiresAt: grant.expiresAt?.toISOString() ?? null,
    }))
    .filter((grant) => grant.commands.length > 0);
}

export async function ackRewardDelivery(db: Database, input: {
  serverId: string;
  minecraftUuid: string;
  rewardGrantId: string;
  deliveryStatus: 'delivered';
  deliveredAt?: Date;
}): Promise<RewardGrantAckResult> {
  const delivered = await markRewardGrantDelivered(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    rewardGrantId: input.rewardGrantId,
    deliveredAt: input.deliveredAt,
  });

  if (delivered) {
    return {
      ok: true,
      delivered: true,
      alreadyDelivered: false,
      rewardGrant: delivered,
    };
  }

  const existing = await findRewardGrantForPlayer(db, {
    serverId: input.serverId,
    minecraftUuid: input.minecraftUuid,
    rewardGrantId: input.rewardGrantId,
  });

  if (!existing) {
    return { ok: false, error: 'reward_grant_not_found' };
  }

  if (existing.status === 'delivered') {
    return {
      ok: true,
      delivered: true,
      alreadyDelivered: true,
      rewardGrant: existing,
    };
  }

  return {
    ok: false,
    error: 'reward_grant_not_pending',
    status: existing.status,
  };
}
