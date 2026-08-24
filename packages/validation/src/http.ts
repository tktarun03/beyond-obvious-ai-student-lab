import { AppError } from '@lab/shared';
import { z } from 'zod';

/**
 * Parse-and-validate at the trust boundary.
 *
 * A route handler should never see an untyped body. Everything past this point
 * is a checked domain object, which is what lets the rest of the code avoid
 * defensive `typeof x === 'string'` noise at every level.
 */
export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError('VALIDATION_FAILED', 'Body is not valid JSON', {
      userMessage: 'The request could not be read.',
    });
  }
  return parseOrThrow(schema, raw);
}

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new AppError('VALIDATION_FAILED', 'Schema validation failed', {
    details: { issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
    userMessage: firstFieldMessage(parsed.error),
  });
}

export function parseSearchParams<T extends z.ZodTypeAny>(url: string, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  return parseOrThrow(schema, params);
}

/**
 * Turns a Zod error into one sentence a person can act on.
 * Error copy rule: say what is wrong AND what to do — never just "invalid input".
 */
function firstFieldMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Some details need fixing.';
  const field = first.path.join('.') || 'request';
  return `${field}: ${first.message}`;
}

/** Maps a Zod error into a per-field record for inline form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    out[key] ??= issue.message;
  }
  return out;
}
