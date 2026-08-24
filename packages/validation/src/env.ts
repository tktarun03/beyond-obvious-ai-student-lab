import { z } from 'zod';

/**
 * Environment validation runs once, at startup, and fails loudly.
 *
 * WHY: the alternative is `process.env.GEMINI_API_KEY!` scattered through the
 * codebase, where a missing value surfaces as an undefined-header error inside
 * a vendor SDK forty frames deep, in production, on a Friday. Validating here
 * turns that into one readable message before the server accepts a request.
 */

const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

const intFromString = (fallback: number) => z.coerce.number().int().nonnegative().default(fallback);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    AI_MODE: z.enum(['mock', 'live']).default('mock'),
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_TEXT_MODEL: z.string().min(1).default('gemini-2.0-flash'),
    GEMINI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-004'),
    AI_MAX_OUTPUT_TOKENS: intFromString(2048),
    AI_TIMEOUT_MS: intFromString(30_000),
    AI_MAX_RETRIES: intFromString(2),
    AI_SESSION_TOKEN_BUDGET: intFromString(200_000),

    DB_MODE: z.enum(['memory', 'firebase']).default('memory'),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    AUTH_MODE: z.enum(['dev', 'firebase']).default('dev'),
    SESSION_SECRET: z.string().min(16).default('dev-only-session-secret-change-me'),

    MAX_UPLOAD_BYTES: intFromString(5 * 1024 * 1024),
    MAX_UPLOADS_PER_USER: intFromString(25),

    RATE_LIMIT_WINDOW_MS: intFromString(60_000),
    RATE_LIMIT_MAX_REQUESTS: intFromString(30),

    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
    LOG_FORMAT: z.enum(['pretty', 'json']).default('pretty'),
    LOG_REDACT_DISABLED: booleanish.default(false),
  })
  // Cross-field rules. A mode is only "configured" if its dependencies are present.
  .superRefine((env, ctx) => {
    if (env.AI_MODE === 'live' && !env.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'AI_MODE=live requires GEMINI_API_KEY. Use AI_MODE=mock to work without a key.',
      });
    }
    if (env.DB_MODE === 'firebase') {
      for (const key of [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
      ] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `DB_MODE=firebase requires ${key}. Use DB_MODE=memory to work without a cloud project.`,
          });
        }
      }
    }
    if (env.NODE_ENV === 'production' && env.SESSION_SECRET.startsWith('dev-only')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'The default SESSION_SECRET must not be used in production.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: z.ZodIssue[]) {
    const lines = issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`);
    super(`Invalid environment configuration:\n${lines.join('\n')}\n\nSee .env.example.`);
    this.name = 'EnvValidationError';
  }
}

let cached: Env | null = null;

/**
 * Reads and validates the environment once per process.
 * Pass an explicit source in tests so a suite never depends on the machine.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached && source === process.env) return cached;

  const raw = { ...source };
  // Firebase private keys are stored with literal \n in env files.
  if (typeof raw.FIREBASE_PRIVATE_KEY === 'string') {
    raw.FIREBASE_PRIVATE_KEY = raw.FIREBASE_PRIVATE_KEY.replace(/\n/g, '\n');
  }
  // Empty strings mean "not set", not "set to empty".
  for (const [k, v] of Object.entries(raw)) if (v === '') delete raw[k];

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) throw new EnvValidationError(parsed.error.issues);

  if (source === process.env) cached = parsed.data;
  return parsed.data;
}

/** Test helper. Never call this from application code. */
export function resetEnvCache(): void {
  cached = null;
}
