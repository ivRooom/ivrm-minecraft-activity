import { eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { minecraftAccounts } from '../db/schema.js';

export type UpsertMinecraftAccountInput = {
  minecraftUuid: string;
  minecraftName: string;
};

export async function upsertMinecraftAccount(db: Database, input: UpsertMinecraftAccountInput) {
  const now = new Date();

  const [account] = await db
    .insert(minecraftAccounts)
    .values({
      minecraftUuid: input.minecraftUuid,
      minecraftName: input.minecraftName,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: minecraftAccounts.minecraftUuid,
      set: {
        minecraftName: input.minecraftName,
        updatedAt: now,
      },
    })
    .returning({
      id: minecraftAccounts.id,
      minecraftUuid: minecraftAccounts.minecraftUuid,
      discordUserId: minecraftAccounts.discordUserId,
    });

  return account;
}

export async function getMinecraftAccount(db: Database, minecraftUuid: string) {
  const [account] = await db
    .select({
      id: minecraftAccounts.id,
      minecraftUuid: minecraftAccounts.minecraftUuid,
      minecraftName: minecraftAccounts.minecraftName,
      discordUserId: minecraftAccounts.discordUserId,
      linkedAt: minecraftAccounts.linkedAt,
      verifiedAt: minecraftAccounts.verifiedAt,
    })
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.minecraftUuid, minecraftUuid))
    .limit(1);

  return account ?? null;
}

export async function isMinecraftAccountLinked(db: Database, minecraftUuid: string): Promise<boolean> {
  const account = await getMinecraftAccount(db, minecraftUuid);
  return Boolean(account?.discordUserId);
}
