import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, enforceRateLimit, resetRateLimits } from './rate-limit.js';

describe('rate limiting', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests up to the limit and blocks the next one', () => {
    const options = { windowMs: 1000, max: 3, now: () => 1_000 };
    expect(checkRateLimit('k', options).allowed).toBe(true);
    expect(checkRateLimit('k', options).allowed).toBe(true);
    expect(checkRateLimit('k', options).allowed).toBe(true);
    expect(checkRateLimit('k', options).allowed).toBe(false);
  });

  it('keeps separate buckets per key, so one user cannot lock out another', () => {
    const options = { windowMs: 1000, max: 1, now: () => 1_000 };
    expect(checkRateLimit('user_a', options).allowed).toBe(true);
    expect(checkRateLimit('user_a', options).allowed).toBe(false);
    expect(checkRateLimit('user_b', options).allowed).toBe(true);
  });

  it('opens a fresh window once the old one expires', () => {
    let now = 1_000;
    const options = { windowMs: 500, max: 1, now: () => now };
    expect(checkRateLimit('k', options).allowed).toBe(true);
    expect(checkRateLimit('k', options).allowed).toBe(false);
    now = 2_000;
    expect(checkRateLimit('k', options).allowed).toBe(true);
  });

  it('throws a RATE_LIMITED AppError telling the caller when to retry', () => {
    const options = { windowMs: 10_000, max: 1, now: () => 1_000 };
    enforceRateLimit('k', options);
    try {
      enforceRateLimit('k', options);
      expect.unreachable();
    } catch (error) {
      expect((error as { code: string }).code).toBe('RATE_LIMITED');
      expect((error as { userMessage: string }).userMessage).toMatch(/try again in \d+ seconds/i);
    }
  });
});
