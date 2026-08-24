import { AppError } from '@lab/shared';

export interface RetryOptions {
  readonly maxRetries: number;
  readonly timeoutMs: number;
  readonly baseDelayMs?: number;
  /** Injectable for tests so a retry suite does not actually sleep. */
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a call with a hard timeout, then retries only the failures that a
 * retry could plausibly fix.
 *
 * WHY not retry everything: retrying a 400 turns one wasted call into three,
 * and retrying a non-idempotent write can double-charge a customer. Retry is
 * for "the network or the model was briefly unavailable", nothing else.
 *
 * Backoff is exponential with full jitter. Without jitter, every client that
 * failed at the same moment retries at the same moment — the thundering herd
 * that keeps a recovering service down.
 */
export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const base = options.baseDelayMs ?? 250;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      return await withTimeout(operation(), options.timeoutMs);
    } catch (cause) {
      const error = AppError.from(cause, 'AI_UNAVAILABLE');
      lastError = error;

      const isLastAttempt = attempt === options.maxRetries;
      if (!error.retryable || isLastAttempt) throw error;

      const delay = Math.round(base * 2 ** attempt * random());
      await sleep(delay);
    }
  }

  throw lastError ?? new AppError('INTERNAL', 'Retry loop ended without a result');
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) return promise;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AppError('AI_TIMEOUT', `Operation exceeded ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
