/**
 * One error taxonomy for the whole lab.
 *
 * WHY a closed set of codes: the HTTP status, the log level, whether the user
 * sees a retry button, and whether the incident is worth paging someone are all
 * derived from the code. Free-form error strings make every one of those
 * decisions a guess at the call site.
 */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
  'AI_BUDGET_EXCEEDED',
  'AI_INVALID_OUTPUT',
  'DEPENDENCY_FAILED',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  AI_UNAVAILABLE: 503,
  AI_TIMEOUT: 504,
  AI_BUDGET_EXCEEDED: 429,
  AI_INVALID_OUTPUT: 502,
  DEPENDENCY_FAILED: 502,
  INTERNAL: 500,
};

/**
 * Messages shown to a user. They say what happened and what to do next, and
 * they never apologise or leak internals — see the voice rules in docs/.
 */
const USER_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some details need fixing before we can continue.',
  UNAUTHENTICATED: 'Sign in to continue.',
  FORBIDDEN: 'This item belongs to another account.',
  NOT_FOUND: 'We could not find that.',
  CONFLICT: 'That was already saved. Reload to see the current version.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  PAYLOAD_TOO_LARGE: 'That file is larger than the limit.',
  UNSUPPORTED_MEDIA_TYPE: 'That file type is not accepted.',
  AI_UNAVAILABLE: 'The AI service is not responding. Your data is safe; try again shortly.',
  AI_TIMEOUT: 'The AI service took too long. Try again, or use a shorter input.',
  AI_BUDGET_EXCEEDED: 'This session has reached its AI usage limit.',
  AI_INVALID_OUTPUT: 'The AI returned something we could not read safely, so we discarded it.',
  DEPENDENCY_FAILED: 'A service we depend on failed. Nothing was changed.',
  INTERNAL: 'Something went wrong on our side. Nothing was changed.',
};

export interface AppErrorOptions {
  /** Extra context for logs. NEVER put secrets or raw user files in here. */
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
  /** Overrides the default user-facing copy when a more specific one helps. */
  readonly userMessage?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly userMessage: string;
  readonly details: Record<string, unknown>;
  /** Whether a caller retrying the exact same request could plausibly succeed. */
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = HTTP_STATUS[code];
    this.userMessage = options.userMessage ?? USER_MESSAGE[code];
    this.details = options.details ?? {};
    this.retryable = code === 'AI_TIMEOUT' || code === 'AI_UNAVAILABLE' || code === 'RATE_LIMITED';
  }

  /** The safe shape to send to a browser: no stack, no cause, no details. */
  toResponseBody(): { error: { code: ErrorCode; message: string; retryable: boolean } } {
    return { error: { code: this.code, message: this.userMessage, retryable: this.retryable } };
  }

  static from(cause: unknown, fallback: ErrorCode = 'INTERNAL'): AppError {
    if (cause instanceof AppError) return cause;
    const message = cause instanceof Error ? cause.message : String(cause);
    return new AppError(fallback, message, { cause });
  }
}

export const isAppError = (value: unknown): value is AppError => value instanceof AppError;
