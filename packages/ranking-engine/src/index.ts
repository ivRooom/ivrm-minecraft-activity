export type RankablePlayer = {
  minecraftUuid: string;
  minecraftName: string;
  discordUserId?: string;
  value: number;
};

export type RankedPlayer = RankablePlayer & {
  rank: number;
};

export function rankPlayers(players: RankablePlayer[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    return a.minecraftName.localeCompare(b.minecraftName);
  });

  return sorted.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

export function topPlayers(players: RankablePlayer[], limit = 5): RankedPlayer[] {
  return rankPlayers(players).slice(0, limit);
}
