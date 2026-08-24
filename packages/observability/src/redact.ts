/**
 * Redaction runs on every log record before it is written.
 *
 * WHY this is not optional: the single most common way a production secret
 * escapes is not a compromised server — it is an engineer logging the request
 * object during a debugging session and forgetting to remove the line. A
 * redactor at the sink means that mistake costs nothing.
 */

const SENSITIVE_KEY =
  /(api[-_]?key|secret|token|password|passwd|credential|authorization|cookie|private[-_]?key|session)/i;

/** Values that look like credentials even when the key name is innocent. */
const SENSITIVE_VALUE_PATTERNS: readonly RegExp[] = [
  /\bAIza[0-9A-Za-z_-]{30,}\b/g, // Google API key
  /\bsk-[A-Za-z0-9]{20,}\b/g, // generic provider secret key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
];

export const REDACTED = '[redacted]';

export function redactString(input: string): string {
  return SENSITIVE_VALUE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, REDACTED), input);
}

/**
 * Deep-redacts an arbitrary value. Cycles are handled, depth is bounded, and
 * long strings are truncated so one runaway payload cannot fill a log sink.
 */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return '[max depth]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    const clean = redactString(value);
    return clean.length > 2000 ? `${clean.slice(0, 2000)}… [truncated]` : clean;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    return value.slice(0, 50).map((item) => redact(item, depth + 1, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[circular]';
    seen.add(value as object);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1, seen);
    }
    return out;
  }
  return String(value);
}
