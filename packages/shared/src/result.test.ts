import { describe, expect, it } from 'vitest';
import { AppError, err, isErr, ok, tryAsync, unwrap, unwrapOr } from './index.js';

describe('Result', () => {
  it('carries a success value', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    expect(unwrap(r)).toBe(42);
  });

  it('falls back on failure instead of throwing', () => {
    expect(unwrapOr(err(new Error('nope')), 'fallback')).toBe('fallback');
  });

  it('captures a thrown error as a failure result', async () => {
    const r = await tryAsync(async () => {
      throw new Error('boom');
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toBe('boom');
  });
});

describe('AppError', () => {
  it('maps a code to an HTTP status', () => {
    expect(new AppError('NOT_FOUND', 'x').status).toBe(404);
    expect(new AppError('RATE_LIMITED', 'x').status).toBe(429);
  });

  it('never leaks internal detail into the response body', () => {
    const error = new AppError('INTERNAL', 'postgres connection string is invalid', {
      details: { dsn: 'postgres://user:pa55w0rd@host/db' },
    });
    const body = JSON.stringify(error.toResponseBody());
    expect(body).not.toContain('pa55w0rd');
    expect(body).not.toContain('postgres');
    expect(error.toResponseBody().error.message).toMatch(/Nothing was changed/);
  });

  it('marks transient AI failures as retryable and validation failures as not', () => {
    expect(new AppError('AI_TIMEOUT', 'x').retryable).toBe(true);
    expect(new AppError('VALIDATION_FAILED', 'x').retryable).toBe(false);
  });
});
