import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

describe('auth module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  describe('POST /auth/register', () => {
    it('creates a user and returns tokens + profile', async () => {
      const payload = validRegisterPayload();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.user.email).toBe(payload.email);
      expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');
      expect(body.expiresInSeconds).toBeGreaterThan(0);
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('rejects malformed input with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'nope', password: 'short' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects a duplicate email with 409', async () => {
      const payload = validRegisterPayload();
      const first = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      expect(first.statusCode).toBe(201);
      const second = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      expect(second.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('issues fresh tokens for valid credentials', async () => {
      const payload = validRegisterPayload();
      await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: payload.email, password: payload.password },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.accessToken).toBeTruthy();
      expect(body.refreshToken).toBeTruthy();
    });

    it('returns 401 for an unknown email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'nobody@example.com', password: 'sup3rS3cret-pw' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for a wrong password', async () => {
      const payload = validRegisterPayload();
      await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: payload.email, password: 'totally-wrong' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 on malformed payload', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token and revokes the previous one', async () => {
      const payload = validRegisterPayload();
      const reg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      const { refreshToken } = reg.json();

      const refreshed = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(refreshed.statusCode).toBe(200);
      const newTokens = refreshed.json();
      expect(newTokens.refreshToken).not.toBe(refreshToken);

      // Old token must no longer work.
      const reuse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(reuse.statusCode).toBe(401);
    });

    it('returns 401 for unknown refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken: 'a'.repeat(60) },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 when the body is missing the refreshToken field', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token (subsequent refresh fails)', async () => {
      const payload = validRegisterPayload();
      const reg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      const { refreshToken } = reg.json();

      const out = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: { refreshToken },
      });
      expect(out.statusCode).toBe(204);

      const refreshed = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(refreshed.statusCode).toBe(401);
    });

    it('is a no-op when called with an unknown token (still 204)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: { refreshToken: 'b'.repeat(60) },
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 400 on malformed body', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', payload: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the authenticated user', async () => {
      const payload = validRegisterPayload();
      const reg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      const { accessToken } = reg.json();

      const me = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(me.statusCode).toBe(200);
      expect(me.json().email).toBe(payload.email);
    });

    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 with a malformed token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Bearer not.a.real.jwt' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 with the wrong scheme', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 404 when the underlying user has been deleted', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validRegisterPayload(),
      });
      const { accessToken, user } = reg.json();

      // Delete the row directly — simulates orphaned tokens.
      const { sql } = await import('kysely');
      const { getTestDb } = await import('./helpers/test-app.js');
      await sql`DELETE FROM users WHERE id = ${user.id}`.execute(getTestDb());

      const me = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(me.statusCode).toBe(404);
    });
  });

  describe('register locale variants', () => {
    it('registers with English locale', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validRegisterPayload({ locale: 'en' }),
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().user.locale).toBe('en');
    });
  });
});
