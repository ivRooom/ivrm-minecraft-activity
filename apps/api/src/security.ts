import { createHmac, timingSafeEqual } from 'node:crypto';

export type SignatureInput = {
  method: string;
  path: string;
  timestamp: string;
  eventId: string;
  body: string;
  secret: string;
};

export function createSignature(input: SignatureInput): string {
  const canonical = [input.method, input.path, input.timestamp, input.eventId, input.body].join('\n');
  return createHmac('sha256', input.secret).update(canonical).digest('hex');
}

export function safeEqualHex(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function isFreshTimestamp(timestamp: string, now = Date.now(), toleranceMs = 5 * 60 * 1000): boolean {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return Math.abs(now - parsed) <= toleranceMs;
}
