import { AppError } from '@lab/shared';

/**
 * Fixed-window rate limiter, in process memory.
 *
 * WHY it is here at all: every route in this repository can trigger an AI call,
 * and an AI call costs money. Without a limiter, one loop in a student's fetch
 * code — or one bored visitor to a deployed demo — is an unbounded bill. The
 * cheapest possible control is worth more than the best control you didn't ship.
 *
 * WHY it is NOT enough for production: memory is per-instance, so N instances
 * allow N times the limit; a fixed window allows a burst of 2x the limit across
 * a window boundary; and an attacker with many IPs bypasses it entirely. The
 * production answer is a shared store (Redis, Upstash) with a sliding window.
 * That is left as a student challenge rather than pretended away.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
  readonly now?: () => number;
}

export interface RateLimitVerdict {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfterSeconds: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitVerdict {
  const now = (options.now ?? Date.now)();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    const window: Window = { count: 1, resetAt: now + options.windowMs };
    windows.set(key, window);
    // Opportunistic cleanup keeps the map from growing without bound in a
    // long-lived dev server. A real limiter would use a store with TTLs.
    if (windows.size > 5000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: window.resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= options.max;
  return {
    allowed,
    remaining: Math.max(0, options.max - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

export function enforceRateLimit(key: string, options: RateLimitOptions): RateLimitVerdict {
  const verdict = checkRateLimit(key, options);
  if (!verdict.allowed) {
    throw new AppError('RATE_LIMITED', `Rate limit exceeded for ${key}`, {
      details: { retryAfterSeconds: verdict.retryAfterSeconds },
      userMessage: `Too many requests. Try again in ${verdict.retryAfterSeconds} seconds.`,
    });
  }
  return verdict;
}

export function resetRateLimits(): void {
  windows.clear();
}
