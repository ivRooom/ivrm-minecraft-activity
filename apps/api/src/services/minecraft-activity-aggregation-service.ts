import type { Database } from '../db/client.js';
import { incrementMinecraftDailyStats } from '../repositories/minecraft-daily-stats-repository.js';
import { incrementMinecraftMonthlyStats } from '../repositories/minecraft-monthly-stats-repository.js';

const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

type ClosedSessionForAggregation = {
  serverId: string;
  minecraftUuid: string;
  joinedAt: Date;
  leftAt: Date;
  totalSeconds: number;
  activeSeconds: number;
  afkSeconds: number;
};

type DailySegment = {
  date: string;
  totalSeconds: number;
  activeSeconds: number;
  afkSeconds: number;
};

function toTokyoDateKey(date: Date): string {
  return new Date(date.getTime() + TOKYO_OFFSET_MS).toISOString().slice(0, 10);
}

function toYearMonth(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function nextTokyoMidnightUtc(date: Date): Date {
  const tokyoDate = new Date(date.getTime() + TOKYO_OFFSET_MS);
  const year = tokyoDate.getUTCFullYear();
  const month = tokyoDate.getUTCMonth();
  const day = tokyoDate.getUTCDate();
  return new Date(Date.UTC(year, month, day + 1, 0, 0, 0) - TOKYO_OFFSET_MS);
}

export function splitSessionByTokyoDate(session: ClosedSessionForAggregation): DailySegment[] {
  if (session.leftAt <= session.joinedAt || session.totalSeconds <= 0) {
    return [];
  }

  const segments: Array<{ date: string; totalSeconds: number }> = [];
  let cursor = session.joinedAt;

  while (cursor < session.leftAt) {
    const boundary = nextTokyoMidnightUtc(cursor);
    const segmentEnd = boundary < session.leftAt ? boundary : session.leftAt;
    const segmentSeconds = Math.max(0, Math.floor((segmentEnd.getTime() - cursor.getTime()) / 1000));

    if (segmentSeconds > 0) {
      segments.push({
        date: toTokyoDateKey(cursor),
        totalSeconds: segmentSeconds,
      });
    }

    cursor = segmentEnd;
  }

  let remainingActiveSeconds = session.activeSeconds;
  let remainingAfkSeconds = session.afkSeconds;

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const activeSeconds = isLast
      ? remainingActiveSeconds
      : Math.min(
        remainingActiveSeconds,
        Math.floor((session.activeSeconds * segment.totalSeconds) / session.totalSeconds),
      );
    const afkSeconds = isLast
      ? remainingAfkSeconds
      : Math.min(
        remainingAfkSeconds,
        Math.floor((session.afkSeconds * segment.totalSeconds) / session.totalSeconds),
      );

    remainingActiveSeconds -= activeSeconds;
    remainingAfkSeconds -= afkSeconds;

    return {
      ...segment,
      activeSeconds,
      afkSeconds,
    };
  });
}

export async function aggregateClosedMinecraftSession(db: Database, session: ClosedSessionForAggregation) {
  const segments = splitSessionByTokyoDate(session);

  for (const segment of segments) {
    const dailyResult = await incrementMinecraftDailyStats(db, {
      serverId: session.serverId,
      minecraftUuid: session.minecraftUuid,
      date: segment.date,
      loginCount: 1,
      activeSeconds: segment.activeSeconds,
      afkSeconds: segment.afkSeconds,
    });

    await incrementMinecraftMonthlyStats(db, {
      serverId: session.serverId,
      minecraftUuid: session.minecraftUuid,
      yearMonth: toYearMonth(segment.date),
      loginDays: dailyResult.created ? 1 : 0,
      loginCount: 1,
      activeSeconds: segment.activeSeconds,
      afkSeconds: segment.afkSeconds,
    });
  }

  return { segments };
}
