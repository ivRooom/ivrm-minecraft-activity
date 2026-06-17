export type MinecraftServerId = string;
export type MinecraftUuid = string;
export type DiscordUserId = string;

export type MinecraftActivityEventBase = {
  serverId: MinecraftServerId;
  minecraftUuid: MinecraftUuid;
  minecraftName: string;
};

export type MinecraftLoginEvent = MinecraftActivityEventBase & {
  joinedAt: string;
};

export type MinecraftLogoutEvent = MinecraftActivityEventBase & {
  leftAt: string;
};

export type MinecraftHeartbeatEvent = MinecraftActivityEventBase & {
  sentAt: string;
  dimension: string;
  afk: boolean;
  lastActiveAt: string;
};

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type RewardCommand = {
  command: string;
};

export type RewardItem = {
  id: string;
  name: string;
  rarity?: RewardRarity;
  commands: RewardCommand[];
};

export type RankingType = 'monthly_playtime' | 'monthly_login_days' | 'login_streak' | 'total_playtime';

export type RankingEntry = {
  rank: number;
  minecraftUuid: MinecraftUuid;
  minecraftName: string;
  discordUserId?: DiscordUserId;
  value: number;
};
