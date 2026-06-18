import type { Database } from '../db/client.js';
import { minecraftEventLogs } from '../db/schema.js';

export type MinecraftEventType = 'login' | 'logout' | 'heartbeat' | 'afk' | 'player-stat';

export type CreateMinecraftEventLogInput = {
  eventId: string;
  serverId: string;
  eventType: MinecraftEventType;
  minecraftUuid: string;
  minecraftName: string;
  payloadJson: unknown;
};

export async function createMinecraftEventLog(
  db: Database,
  input: CreateMinecraftEventLogInput,
): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(minecraftEventLogs)
    .values({
      eventId: input.eventId,
      serverId: input.serverId,
      eventType: input.eventType,
      minecraftUuid: input.minecraftUuid,
      minecraftName: input.minecraftName,
      payloadJson: input.payloadJson,
    })
    .onConflictDoNothing({ target: minecraftEventLogs.eventId })
    .returning({ id: minecraftEventLogs.id });

  return { inserted: rows.length > 0 };
}
