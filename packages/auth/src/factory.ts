import { loadEnv, type Env } from '@lab/validation';
import { DevAuthProvider } from './dev-provider.js';
import { FirebaseAuthProvider } from './firebase-provider.js';
import type { AuthProvider } from './types.js';

let cached: { mode: string; provider: AuthProvider } | null = null;

export function getAuthProvider(env: Env = loadEnv()): AuthProvider {
  if (cached?.mode === env.AUTH_MODE) return cached.provider;

  const provider: AuthProvider =
    env.AUTH_MODE === 'firebase'
      ? new FirebaseAuthProvider({
          projectId: env.FIREBASE_PROJECT_ID ?? '',
          clientEmail: env.FIREBASE_CLIENT_EMAIL ?? '',
          privateKey: env.FIREBASE_PRIVATE_KEY ?? '',
        })
      : new DevAuthProvider(env.SESSION_SECRET);

  cached = { mode: env.AUTH_MODE, provider };
  return provider;
}

export function resetAuthProvider(): void {
  cached = null;
}
