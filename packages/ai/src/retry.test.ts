import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@lab/shared';
import { withRetry, withTimeout } from './retry.js';

const noSleep = async () => {};

describe('withRetry', () => {
  it('returns the first successful result without retrying', async () => {
    const op = vi.fn(async () => 'ok');
    await expect(withRetry(op, { maxRetries: 3, timeoutMs: 1000, sleep: noSleep })).resolves.toBe(
      'ok',
    );
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure and then succeeds', async () => {
    let calls = 0;
    const op = async () => {
      calls += 1;
      if (calls < 3) throw new AppError('AI_UNAVAILABLE', 'upstream hiccup');
      return 'recovered';
    };
    const result = await withRetry(op, {
      maxRetries: 3,
      timeoutMs: 1000,
      sleep: noSleep,
      random: () => 0,
    });
    expect(result).toBe('recovered');
    expect(calls).toBe(3);
  });

  // The behaviour that separates a considered retry policy from a `for` loop.
  it('does NOT retry a non-retryable failure', async () => {
    const op = vi.fn(async () => {
      throw new AppError('VALIDATION_FAILED', 'bad request');
    });
    await expect(withRetry(op, { maxRetries: 5, timeoutMs: 1000, sleep: noSleep })).rejects.toThrow(
      /bad request/,
    );
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxRetries and surfaces the last error', async () => {
    const op = vi.fn(async () => {
      throw new AppError('AI_UNAVAILABLE', 'still down');
    });
    await expect(
      withRetry(op, { maxRetries: 2, timeoutMs: 1000, sleep: noSleep, random: () => 0 }),
    ).rejects.toThrow(/still down/);
    expect(op).toHaveBeenCalledTimes(3);
  });
});

describe('withTimeout', () => {
  it('rejects with AI_TIMEOUT when the operation is too slow', async () => {
    vi.useFakeTimers();
    const slow = new Promise((resolve) => setTimeout(resolve, 10_000));
    const raced = withTimeout(slow, 50);
    vi.advanceTimersByTime(60);
    await expect(raced).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    vi.useRealTimers();
  });
});
