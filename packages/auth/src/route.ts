import { AppError, newId } from '@lab/shared';
import { getLogger } from '@lab/observability';
import { loadEnv, type Env } from '@lab/validation';
import { getAuthProvider } from './factory.js';
import { enforceRateLimit } from './rate-limit.js';
import type { Session } from './types.js';

/**
 * The wrapper every API route in this repository uses.
 *
 * It exists so that five projects cannot each forget a different control. In
 * order, every request gets:
 *   1. a request id, attached to every log line it produces;
 *   2. rate limiting, keyed by user when known and by IP when not;
 *   3. authentication, when the route declares it needs a user;
 *   4. the handler;
 *   5. error translation — an AppError becomes its safe response body, and an
 *      unexpected throw becomes a generic 500 with the detail logged, never
 *      returned.
 *
 * Step 5 is the one people skip. Leaking a stack trace tells an attacker your
 * framework, your file layout and sometimes your database schema.
 */

export interface RouteContext {
  readonly request: Request;
  readonly session: Session | null;
  readonly requestId: string;
  readonly env: Env;
  readonly log: ReturnType<typeof getLogger>;
}

export interface AuthedRouteContext extends RouteContext {
  readonly session: Session;
}

export interface RouteOptions {
  readonly name: string;
  readonly requireAuth?: boolean;
  /** Overrides the environment default for expensive routes. */
  readonly rateLimit?: { windowMs: number; max: number };
}

type Handler<C extends RouteContext> = (context: C) => Promise<Response>;

export function apiRoute(
  options: RouteOptions & { requireAuth: true },
  handler: Handler<AuthedRouteContext>,
): (request: Request) => Promise<Response>;
export function apiRoute(
  options: RouteOptions,
  handler: Handler<RouteContext>,
): (request: Request) => Promise<Response>;
export function apiRoute(
  options: RouteOptions,
  handler: Handler<never>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const requestId = newId('req');
    const env = loadEnv();
    const log = getLogger(`api:${options.name}`).child('req', { requestId });
    const started = performance.now();

    try {
      const session = await getAuthProvider(env).getSession(request);

      const limitKey = session?.user.id ?? clientIp(request);
      const limits = options.rateLimit ?? {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX_REQUESTS,
      };
      enforceRateLimit(`${options.name}:${limitKey}`, limits);

      if (options.requireAuth && !session) {
        throw new AppError('UNAUTHENTICATED', `${options.name} requires a signed-in user`);
      }

      const context = { request, session, requestId, env, log } as never;
      const response = await (handler as Handler<RouteContext>)(context);

      log.info('handled', {
        route: options.name,
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        userId: session?.user.id,
      });

      response.headers.set('x-request-id', requestId);
      return response;
    } catch (cause) {
      const error = AppError.from(cause);
      const level = error.status >= 500 ? 'error' : 'warn';

      log[level]('failed', {
        route: options.name,
        code: error.code,
        status: error.status,
        // The internal message goes to the log; the user gets error.userMessage.
        reason: error.message,
        details: error.details,
        durationMs: Math.round(performance.now() - started),
      });

      return jsonResponse(error.toResponseBody(), error.status, {
        'x-request-id': requestId,
        ...(error.code === 'RATE_LIMITED'
          ? { 'retry-after': String(error.details.retryAfterSeconds ?? 60) }
          : {}),
      });
    }
  };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // These are cheap, universal, and absent from most tutorial code.
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

/**
 * Best-effort client address. Header values are attacker-controlled, so this is
 * fine for rate-limit bucketing and must never be used for authorization.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
