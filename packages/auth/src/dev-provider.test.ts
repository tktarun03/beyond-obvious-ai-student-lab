import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DevAuthProvider, serialiseCookie } from './dev-provider.js';
import { SESSION_COOKIE } from './types.js';

const SECRET = 'a-test-secret-long-enough-to-pass';
const provider = new DevAuthProvider(SECRET);

const requestWithCookie = (value: string) =>
  new Request('http://localhost/api/thing', {
    headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(value)}` },
  });

describe('DevAuthProvider', () => {
  it('signs a valid user in and reads the session back', async () => {
    const { session, cookie } = await provider.signIn({
      email: 'ana@student.example',
      password: DEMO_PASSWORD,
    });
    expect(session.user.email).toBe('ana@student.example');

    const restored = await provider.getSession(requestWithCookie(cookie.value));
    expect(restored?.user.id).toBe(session.user.id);
  });

  it('rejects a wrong password', async () => {
    await expect(
      provider.signIn({ email: 'ana@student.example', password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('gives an unknown email the same message as a wrong password', async () => {
    const missing = await provider
      .signIn({ email: 'nobody@student.example', password: DEMO_PASSWORD })
      .catch((e) => e);
    const wrong = await provider
      .signIn({ email: 'ana@student.example', password: 'wrong' })
      .catch((e) => e);
    // Identical copy: the API must not confirm which emails have accounts.
    expect(missing.userMessage).toBe(wrong.userMessage);
  });

  // The attack this defends against: a user base64-decodes their own cookie,
  // changes the user id to someone else's, and re-encodes it.
  it('rejects a tampered session payload', async () => {
    const { cookie } = await provider.signIn({
      email: 'ana@student.example',
      password: DEMO_PASSWORD,
    });
    const [payload, signature] = cookie.value.split('.');
    const decoded = JSON.parse(Buffer.from(payload!, 'base64url').toString());
    decoded.user.id = 'user_ravi';
    const forged = `${Buffer.from(JSON.stringify(decoded)).toString('base64url')}.${signature}`;

    expect(await provider.getSession(requestWithCookie(forged))).toBeNull();
  });

  it('rejects a session signed with a different secret', async () => {
    const other = new DevAuthProvider('a-completely-different-secret-value');
    const { cookie } = await other.signIn({
      email: 'ana@student.example',
      password: DEMO_PASSWORD,
    });
    expect(await provider.getSession(requestWithCookie(cookie.value))).toBeNull();
  });

  it('rejects an expired session even though the signature is valid', async () => {
    const expired = {
      user: { id: 'user_ana', email: 'a@b.c', name: 'A', role: 'member' },
      expiresAt: 1,
    };
    const payload = Buffer.from(JSON.stringify(expired)).toString('base64url');
    const signature = (provider as unknown as { sign(p: string): string })['sign'](payload);
    expect(await provider.getSession(requestWithCookie(`${payload}.${signature}`))).toBeNull();
  });

  it('returns null when no cookie is present rather than throwing', async () => {
    expect(await provider.getSession(new Request('http://localhost/'))).toBeNull();
  });
});

describe('serialiseCookie', () => {
  it('always sets HttpOnly and SameSite, and Secure only when asked', () => {
    const value = serialiseCookie({ name: 'x', value: 'y', maxAgeSeconds: 60 }, false);
    expect(value).toContain('HttpOnly');
    expect(value).toContain('SameSite=Lax');
    expect(value).not.toContain('Secure');
    expect(serialiseCookie({ name: 'x', value: 'y', maxAgeSeconds: 60 }, true)).toContain('Secure');
  });
});
