import { AppError } from '@lab/shared';
import { getLogger, type Logger } from './logger.js';

export interface SpanResult {
  readonly name: string;
  readonly durationMs: number;
  readonly ok: boolean;
}

/**
 * Times an async operation and logs one structured record for it.
 *
 * WHY not a full tracing SDK: a student needs to internalise the *habit* of
 * "every external call is measured and named" before the vendor-specific parts
 * matter. Swapping this for OpenTelemetry later is a contained change because
 * every call site already has a name and an attribute bag.
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, unknown>,
  fn: () => Promise<T>,
  logger: Logger = getLogger('span'),
): Promise<T> {
  const start = performance.now();
  try {
    const value = await fn();
    logger.debug(`${name} ok`, { ...attributes, durationMs: round(performance.now() - start) });
    return value;
  } catch (cause) {
    const error = AppError.from(cause);
    logger.error(`${name} failed`, {
      ...attributes,
      durationMs: round(performance.now() - start),
      code: error.code,
      reason: error.message,
    });
    throw error;
  }
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Percentiles over a set of latency samples — used by the eval runners. */
export function latencyStats(samples: readonly number[]): {
  count: number;
  p50: number;
  p95: number;
  max: number;
  mean: number;
} {
  if (samples.length === 0) return { count: 0, p50: 0, p95: 0, max: 0, mean: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return {
    count: sorted.length,
    p50: round(at(0.5)),
    p95: round(at(0.95)),
    max: round(sorted[sorted.length - 1] ?? 0),
    mean: round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
  };
}
