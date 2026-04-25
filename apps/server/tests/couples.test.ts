import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

const register = async (
  app: FastifyInstance,
  overrides: Partial<Record<string, unknown>> = {},
): Promise<{ accessToken: string; userId: string }> => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: validRegisterPayload(overrides),
  });
  const body = res.json();
  return { accessToken: body.accessToken, userId: body.user.id };
};

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

describe('couples module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });
  beforeEach(async () => {
    const { sql } = await import('kysely');
    const { getTestDb } = await import('./helpers/test-app.js');
    await truncateAll();
    // truncateAll only resets users + metrics; couples cascades from users.
    await sql`TRUNCATE TABLE couple_members, couples RESTART IDENTITY CASCADE`.execute(getTestDb());
  });

  it('GET /couples/me returns null when unpaired', async () => {
    const { accessToken } = await register(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/couples/me',
      headers: auth(accessToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().view).toBeNull();
  });

  it('POST /couples creates a couple and returns the view with an invite code', async () => {
    const { accessToken, userId } = await register(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(accessToken),
    });
    expect(res.statusCode).toBe(201);
    const view = res.json();
    expect(view.couple.inviteCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    expect(view.couple.members.length).toBe(1);
    expect(view.couple.members[0].userId).toBe(userId);
    expect(view.couple.members[0].role).toBe('owner');
    expect(view.partners).toEqual([]);
  });

  it('POST /couples returns 409 when already in a couple', async () => {
    const { accessToken } = await register(app);
    await app.inject({ method: 'POST', url: '/api/v1/couples', headers: auth(accessToken) });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(accessToken),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('already_in_couple');
  });

  it('POST /couples/join lets a second user join via invite code', async () => {
    const a = await register(app, { email: 'a@b.io' });
    const b = await register(app, { email: 'b@b.io' });
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(a.accessToken),
    });
    const inviteCode = created.json().couple.inviteCode;

    const joined = await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(b.accessToken),
      payload: { inviteCode },
    });
    expect(joined.statusCode).toBe(200);
    const view = joined.json();
    expect(view.couple.members.length).toBe(2);
    expect(view.partners.length).toBe(1);
    expect(view.partners[0].id).toBe(a.userId);

    // A's view now sees B as the partner.
    const aView = await app.inject({
      method: 'GET',
      url: '/api/v1/couples/me',
      headers: auth(a.accessToken),
    });
    expect(aView.json().view.partners[0].id).toBe(b.userId);
  });

  it('POST /couples/join 404s on an unknown invite code', async () => {
    const { accessToken } = await register(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(accessToken),
      payload: { inviteCode: 'ZZZZZZZZ' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /couples/join 400s on malformed invite code', async () => {
    const { accessToken } = await register(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(accessToken),
      payload: { inviteCode: 'lower' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /couples/join 409s when the joiner already belongs to a couple', async () => {
    const a = await register(app, { email: 'a@b.io' });
    const b = await register(app, { email: 'b@b.io' });
    const c = await register(app, { email: 'c@b.io' });

    const aCouple = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(a.accessToken),
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(b.accessToken),
      payload: { inviteCode: aCouple.json().couple.inviteCode },
    });

    // C creates their own couple.
    const cCouple = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(c.accessToken),
    });

    // B (already in A+B) tries to join C's couple.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(b.accessToken),
      payload: { inviteCode: cCouple.json().couple.inviteCode },
    });
    expect(res.statusCode).toBe(409);
  });

  it('DELETE /couples/me removes the caller and disbands when empty', async () => {
    const { accessToken } = await register(app);
    await app.inject({ method: 'POST', url: '/api/v1/couples', headers: auth(accessToken) });
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/couples/me',
      headers: auth(accessToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().disbanded).toBe(true);

    // The user is now unpaired.
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/couples/me',
      headers: auth(accessToken),
    });
    expect(me.json().view).toBeNull();
  });

  it('DELETE /couples/me leaves a member without disbanding when others remain', async () => {
    const a = await register(app, { email: 'a@b.io' });
    const b = await register(app, { email: 'b@b.io' });
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(a.accessToken),
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(b.accessToken),
      payload: { inviteCode: created.json().couple.inviteCode },
    });
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/couples/me',
      headers: auth(b.accessToken),
    });
    expect(res.json().disbanded).toBe(false);
  });

  it('DELETE /couples/me 404s when caller is not in any couple', async () => {
    const { accessToken } = await register(app);
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/couples/me',
      headers: auth(accessToken),
    });
    expect(res.statusCode).toBe(404);
  });

  it('all couples routes require authentication', async () => {
    for (const route of [
      { method: 'GET' as const, url: '/api/v1/couples/me' },
      { method: 'POST' as const, url: '/api/v1/couples' },
      { method: 'POST' as const, url: '/api/v1/couples/join' },
      { method: 'DELETE' as const, url: '/api/v1/couples/me' },
    ]) {
      const res = await app.inject(route);
      expect(res.statusCode).toBe(401);
    }
  });
});
