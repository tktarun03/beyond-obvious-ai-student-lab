import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '@lab/shared';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type AuthProvider,
  type AuthUser,
  type Session,
  type SignInResult,
} from './types.js';

/**
 * A real session implementation with no external dependency.
 *
 * WHAT IT DEMONSTRATES (deliberately, because these are the parts interviewers
 * ask about):
 *   • passwords are never stored — only a scrypt hash with a per-user salt;
 *   • comparisons are timing-safe, so response time does not leak the answer;
 *   • the session cookie is signed, so a user cannot edit their own user id;
 *   • the cookie carries an expiry that the SERVER checks.
 *
 * WHAT IT IS NOT: production authentication. There is no account lockout, no
 * password reset, no MFA, no revocation list, no rotation, and the user store
 * is seeded in memory. Set AUTH_MODE=firebase for a managed implementation.
 * Rolling your own auth for real users is a mistake this file is careful not
 * to imply is fine.
 */

interface StoredUser extends AuthUser {
  readonly salt: string;
  readonly passwordHash: string;
}

const SCRYPT_KEYLEN = 64;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
}

/**
 * Seeded demo accounts. The password is intentionally published: these accounts
 * exist only in an in-memory store on a developer machine, and pretending they
 * are secret would teach the wrong lesson about what a secret is.
 */
export const DEMO_PASSWORD = 'lab-demo-2026';

const DEMO_USERS: readonly Omit<StoredUser, 'salt' | 'passwordHash'>[] = [
  { id: 'user_ana', email: 'ana@student.example', name: 'Ana Moreira', role: 'member' },
  { id: 'user_ravi', email: 'ravi@student.example', name: 'Ravi Iyer', role: 'reviewer' },
];

const users = new Map<string, StoredUser>();

function seedUsers(): void {
  if (users.size > 0) return;
  for (const user of DEMO_USERS) {
    const salt = randomBytes(16).toString('hex');
    users.set(user.email, { ...user, salt, passwordHash: hashPassword(DEMO_PASSWORD, salt) });
  }
}

export function listDemoUsers(): AuthUser[] {
  seedUsers();
  return [...users.values()].map(({ salt: _salt, passwordHash: _hash, ...user }) => user);
}

const base64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

export class DevAuthProvider implements AuthProvider {
  readonly name = 'dev';

  constructor(private readonly secret: string) {
    if (secret.length < 16) {
      throw new AppError('INTERNAL', 'SESSION_SECRET must be at least 16 characters');
    }
    seedUsers();
  }

  async signIn(credentials: { email: string; password?: string }): Promise<SignInResult> {
    const user = users.get(credentials.email.trim().toLowerCase());
    const password = credentials.password ?? '';

    // Hash even when the user does not exist. Returning early would make a
    // missing account measurably faster than a wrong password, which is a free
    // user-enumeration oracle.
    const salt = user?.salt ?? 'absent-user-placeholder-salt';
    const attempt = hashPassword(password, salt);
    const expected = user?.passwordHash ?? hashPassword('never-matches', salt);

    const attemptBuffer = Buffer.from(attempt, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const matches =
      attemptBuffer.length === expectedBuffer.length &&
      timingSafeEqual(attemptBuffer, expectedBuffer);

    if (!user || !matches) {
      // One message for both failure cases, for the same reason.
      throw new AppError('UNAUTHENTICATED', 'Sign-in failed', {
        userMessage: 'That email and password do not match an account.',
      });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const session: Session = {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      expiresAt,
    };

    return {
      session,
      cookie: {
        name: SESSION_COOKIE,
        value: this.encode(session),
        maxAgeSeconds: SESSION_TTL_SECONDS,
      },
    };
  }

  async getSession(request: Request): Promise<Session | null> {
    const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
    return token ? this.decode(token) : null;
  }

  signOutCookie() {
    return { name: SESSION_COOKIE, value: '', maxAgeSeconds: 0 };
  }

  private encode(session: Session): string {
    const payload = base64url(JSON.stringify(session));
    return `${payload}.${this.sign(payload)}`;
  }

  /** Returns null for anything that is not a currently valid, correctly signed token. */
  private decode(token: string): Session | null {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expected = this.sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    try {
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
      // Expiry is enforced here, server-side. A cookie's own Max-Age is a hint
      // to the browser and nothing more — the client controls what it sends.
      if (typeof session.expiresAt !== 'number' || session.expiresAt < Date.now() / 1000) {
        return null;
      }
      if (!session.user?.id || !session.user?.email) return null;
      return session;
    } catch {
      return null;
    }
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** Builds a hardened Set-Cookie value. */
export function serialiseCookie(
  cookie: { name: string; value: string; maxAgeSeconds: number },
  secure: boolean,
): string {
  const parts = [
    `${cookie.name}=${encodeURIComponent(cookie.value)}`,
    'Path=/',
    // HttpOnly: unreadable from JavaScript, so an XSS bug cannot steal the session.
    'HttpOnly',
    // SameSite=Lax: the cookie is not sent on cross-site POSTs, which removes
    // the simplest CSRF vector without breaking ordinary navigation.
    'SameSite=Lax',
    `Max-Age=${cookie.maxAgeSeconds}`,
  ];
  // Secure is conditional only so that http://localhost works during development.
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
