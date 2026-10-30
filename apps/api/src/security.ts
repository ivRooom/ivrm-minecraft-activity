import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

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


/**
 * Compare opaque API credentials without leaking a matching prefix or length
 * through the comparison primitive. Callers must still enforce transport TLS,
 * request limits and separate authorization for privileged actions.
 */
export function safeEqualSecret(expected: string, actual: string): boolean {
  const expectedDigest = createHash('sha256').update(expected).digest();
  const actualDigest = createHash('sha256').update(actual).digest();
  return timingSafeEqual(expectedDigest, actualDigest);
}

export function isFreshTimestamp(timestamp: string, now = Date.now(), toleranceMs = 5 * 60 * 1000): boolean {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return Math.abs(now - parsed) <= toleranceMs;
}
