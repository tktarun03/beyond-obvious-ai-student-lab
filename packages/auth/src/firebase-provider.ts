import { AppError } from '@lab/shared';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type AuthProvider,
  type Session,
  type SignInResult,
} from './types.js';
import { readCookie } from './dev-provider.js';

/**
 * Firebase Authentication, used when AUTH_MODE=firebase.
 *
 * The browser signs in with the Firebase web SDK and sends the resulting ID
 * token here once. The server VERIFIES that token (signature, issuer, audience
 * and expiry, checked against Google's rotating public keys) and then mints its
 * own short-lived session cookie.
 *
 * WHY not just keep the ID token in the browser and send it on every request:
 * an ID token in JavaScript-readable storage is stealable by any XSS bug, and
 * it cannot be revoked before it expires. A verified, HttpOnly session cookie
 * narrows both problems.
 */

interface FirebaseAuthLike {
  verifyIdToken(
    token: string,
    checkRevoked?: boolean,
  ): Promise<{
    uid: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  }>;
  createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string>;
  verifySessionCookie(
    cookie: string,
    checkRevoked?: boolean,
  ): Promise<{
    uid: string;
    email?: string;
    name?: string;
    exp: number;
  }>;
}

export interface FirebaseAuthConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

let cachedAuth: FirebaseAuthLike | null = null;

async function getAuth(config: FirebaseAuthConfig): Promise<FirebaseAuthLike> {
  if (cachedAuth) return cachedAuth;
  try {
    const appModule = 'firebase-admin/app';
    const authModule = 'firebase-admin/auth';
    const { initializeApp, getApps, cert } = (await import(appModule)) as {
      initializeApp: (options: unknown) => unknown;
      getApps: () => unknown[];
      cert: (options: unknown) => unknown;
    };
    const { getAuth: get } = (await import(authModule)) as { getAuth: () => FirebaseAuthLike };
    if (getApps().length === 0) {
      initializeApp({ credential: cert({ ...config }) });
    }
    cachedAuth = get();
    return cachedAuth;
  } catch (cause) {
    throw new AppError('DEPENDENCY_FAILED', 'firebase-admin is not installed or failed to start', {
      cause,
      userMessage:
        'Sign-in is unavailable. Run "npm install firebase-admin", or set AUTH_MODE=dev.',
    });
  }
}

export class FirebaseAuthProvider implements AuthProvider {
  readonly name = 'firebase';

  constructor(private readonly config: FirebaseAuthConfig) {}

  async signIn(credentials: { email: string; idToken?: string }): Promise<SignInResult> {
    if (!credentials.idToken) {
      throw new AppError('VALIDATION_FAILED', 'An ID token is required in firebase auth mode', {
        userMessage: 'Sign-in did not complete. Try again.',
      });
    }
    const auth = await getAuth(this.config);

    // checkRevoked = true costs one extra lookup and makes "sign out everywhere"
    // actually work. Worth it at sign-in; too expensive on every request.
    const decoded = await auth.verifyIdToken(credentials.idToken, true).catch((cause: unknown) => {
      throw new AppError('UNAUTHENTICATED', 'ID token verification failed', { cause });
    });

    const cookieValue = await auth.createSessionCookie(credentials.idToken, {
      expiresIn: SESSION_TTL_SECONDS * 1000,
    });

    return {
      session: {
        user: {
          id: decoded.uid,
          email: decoded.email ?? credentials.email,
          name: decoded.name ?? decoded.email ?? 'Member',
          role: 'member',
        },
        expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      },
      cookie: { name: SESSION_COOKIE, value: cookieValue, maxAgeSeconds: SESSION_TTL_SECONDS },
    };
  }

  async getSession(request: Request): Promise<Session | null> {
    const cookie = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
    if (!cookie) return null;
    try {
      const auth = await getAuth(this.config);
      const decoded = await auth.verifySessionCookie(cookie);
      return {
        user: {
          id: decoded.uid,
          email: decoded.email ?? '',
          name: decoded.name ?? decoded.email ?? 'Member',
          role: 'member',
        },
        expiresAt: decoded.exp,
      };
    } catch {
      // An unverifiable cookie is simply "not signed in".
      return null;
    }
  }

  signOutCookie() {
    return { name: SESSION_COOKIE, value: '', maxAgeSeconds: 0 };
  }
}
