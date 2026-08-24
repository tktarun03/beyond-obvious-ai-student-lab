export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  /** Coarse role. Project 04 uses it to gate who may approve a code change. */
  readonly role: 'member' | 'reviewer';
}

export interface Session {
  readonly user: AuthUser;
  /** Unix seconds. */
  readonly expiresAt: number;
}

export interface SignInResult {
  readonly session: Session;
  /** Value to place in a Set-Cookie header. */
  readonly cookie: { name: string; value: string; maxAgeSeconds: number };
}

export interface AuthProvider {
  readonly name: string;
  /**
   * Reads a session from an incoming request. Returns null rather than
   * throwing: "not signed in" is a normal state, not an error.
   */
  getSession(request: Request): Promise<Session | null>;
  signIn(credentials: {
    email: string;
    password?: string;
    idToken?: string;
  }): Promise<SignInResult>;
  signOutCookie(): { name: string; value: string; maxAgeSeconds: number };
}

export const SESSION_COOKIE = 'lab_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
