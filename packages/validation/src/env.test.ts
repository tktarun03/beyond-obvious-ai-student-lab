import { describe, expect, it } from 'vitest';
import { EnvValidationError, loadEnv } from './env.js';

const base = { SESSION_SECRET: 'a-sufficiently-long-secret-value' };
const testEnv = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe('loadEnv', () => {
  it('defaults to the free, keyless configuration', () => {
    const env = loadEnv(testEnv({ ...base }));
    expect(env.AI_MODE).toBe('mock');
    expect(env.DB_MODE).toBe('memory');
    expect(env.AUTH_MODE).toBe('dev');
  });

  it('refuses live AI mode without a key, and says how to proceed', () => {
    try {
      loadEnv(testEnv({ ...base, AI_MODE: 'live' }));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect((error as Error).message).toContain('GEMINI_API_KEY');
      expect((error as Error).message).toContain('AI_MODE=mock');
    }
  });

  it('refuses firebase database mode without credentials', () => {
    expect(() => loadEnv(testEnv({ ...base, DB_MODE: 'firebase' }))).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('coerces numeric strings and rejects the default secret in production', () => {
    const env = loadEnv(testEnv({ ...base, MAX_UPLOAD_BYTES: '1024' }));
    expect(env.MAX_UPLOAD_BYTES).toBe(1024);
    expect(() =>
      loadEnv(
        testEnv({ NODE_ENV: 'production', SESSION_SECRET: 'dev-only-session-secret-change-me' }),
      ),
    ).toThrow(/SESSION_SECRET/);
  });

  it('treats an empty string as unset rather than as an invalid value', () => {
    const env = loadEnv(testEnv({ ...base, GEMINI_TEXT_MODEL: '' }));
    expect(env.GEMINI_TEXT_MODEL).toBe('gemini-2.0-flash');
  });
});
