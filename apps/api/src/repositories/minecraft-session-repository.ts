import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { minecraftSessionHeartbeats, minecraftSessions } from '../db/schema.js';

export type PlayerIdentity = {
  serverId: string;
  minecraftUuid: string;
  minecraftName: string;
};

export type HeartbeatInput = PlayerIdentity & {
  sentAt: Date;
  dimension?: string | null;
  afk: boolean;
};

async function findActiveSession(db: Database, input: Pick<PlayerIdentity, 'serverId' | 'minecraftUuid'>) {
  const [session] = await db
    .select()
    .from(minecraftSessions)
    .where(and(
      eq(minecraftSessions.serverId, input.serverId),
      eq(minecraftSessions.minecraftUuid, input.minecraftUuid),
      eq(minecraftSessions.status, 'active'),
    ))
    .orderBy(desc(minecraftSessions.joinedAt))
    .limit(1);

  return session;
}

export async function openMinecraftSession(db: Database, input: PlayerIdentity & { joinedAt: Date }) {
  const now = new Date();

  await db
    .update(minecraftSessions)
    .set({
      status: 'replaced',
      leftAt: input.joinedAt,
      lastSeenAt: input.joinedAt,
      updatedAt: now,
    })
    .where(and(
      eq(minecraftSessions.serverId, input.serverId),
      eq(minecraftSessions.minecraftUuid, input.minecraftUuid),
      eq(minecraftSessions.status, 'active'),
    ));

  const [session] = await db
    .insert(minecraftSessions)
    .values({
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      minecraftName: input.minecraftName,
      joinedAt: input.joinedAt,
      lastSeenAt: input.joinedAt,
      status: 'active',
      updatedAt: now,
    })
    .returning({ id: minecraftSessions.id });

  return session;
}

export async function recordMinecraftHeartbeat(db: Database, input: HeartbeatInput) {
  const now = new Date();
  const session = await findActiveSession(db, input);

  if (!session) {
    return null;
  }

  await db
    .update(minecraftSessions)
    .set({
      minecraftName: input.minecraftName,
      lastSeenAt: input.sentAt,
      updatedAt: now,
    })
    .where(eq(minecraftSessions.id, session.id));

  const [heartbeat] = await db
    .insert(minecraftSessionHeartbeats)
    .values({
      sessionId: session.id,
      serverId: input.serverId,
      minecraftUuid: input.minecraftUuid,
      dimension: input.dimension,
      afk: input.afk,
      sentAt: input.sentAt,
    })
    .returning({ id: minecraftSessionHeartbeats.id });

  return { sessionId: session.id, heartbeatId: heartbeat.id };
}

export async function closeMinecraftSession(db: Database, input: PlayerIdentity & { leftAt: Date }) {
  const session = await findActiveSession(db, input);

  if (!session) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor((input.leftAt.getTime() - session.joinedAt.getTime()) / 1000));
  const afkSeconds = session.afkSeconds ?? 0;
  const activeSeconds = Math.max(0, totalSeconds - afkSeconds);

  const [closedSession] = await db
    .update(minecraftSessions)
    .set({
      minecraftName: input.minecraftName,
      leftAt: input.leftAt,
      lastSeenAt: input.leftAt,
      totalSeconds,
      afkSeconds,
      activeSeconds,
      status: 'closed',
      updatedAt: new Date(),
    })
    .where(eq(minecraftSessions.id, session.id))
    .returning({
      id: minecraftSessions.id,
      serverId: minecraftSessions.serverId,
      minecraftUuid: minecraftSessions.minecraftUuid,
      joinedAt: minecraftSessions.joinedAt,
      leftAt: minecraftSessions.leftAt,
      totalSeconds: minecraftSessions.totalSeconds,
      afkSeconds: minecraftSessions.afkSeconds,
      activeSeconds: minecraftSessions.activeSeconds,
    });

  return closedSession;
}
