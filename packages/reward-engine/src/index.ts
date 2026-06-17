export type WeightedReward<T> = {
  weight: number;
  item: T;
};

export function pickWeightedReward<T>(items: WeightedReward<T>[], random = Math.random): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    throw new Error('Reward pool total weight must be greater than zero.');
  }

  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.item;
    }
  }

  return items[items.length - 1]!.item;
}

export function isAllowedRewardCommand(command: string): boolean {
  const normalized = command.trim().toLowerCase();
  return normalized.startsWith('give ');
}
