import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

describe('shared activity feed', () => {
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

  const register = async (email: string, displayName: string) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validRegisterPayload({ email, displayName }),
    });
    return response.json<{ accessToken: string; user: { id: string } }>();
  };

  const pair = async () => {
    const owner = await register('feed-owner@example.com', 'Jane');
    const partner = await register('feed-partner@example.com', 'Alex');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(owner.accessToken),
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: auth(partner.accessToken),
      payload: { inviteCode: created.json().couple.inviteCode },
    });
    return { owner, partner };
  };

  it('requires authentication and an active couple', async () => {
    const unauthenticated = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/feed',
    });
    const solo = await register('solo@example.com', 'Solo');
    const unpaired = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/activities',
      headers: auth(solo.accessToken),
      payload: { kind: 'hydration' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: auth(solo.accessToken),
    });
    const soloCouple = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/feed',
      headers: auth(solo.accessToken),
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(unpaired.statusCode).toBe(409);
    expect(unpaired.json().error.code).toBe('not_paired');
    expect(soloCouple.statusCode).toBe(409);
  });

  it('validates the safe activity whitelist', async () => {
    const { owner } = await pair();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/activities',
      headers: auth(owner.accessToken),
      payload: { kind: 'weight_loss', weightKg: 70 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('invalid_body');
  });

  it('shares a win only with the current couple and supports reconciliation', async () => {
    const { owner, partner } = await pair();
    const outsider = await register('outsider@example.com', 'Morgan');

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/activities',
      headers: auth(owner.accessToken),
      payload: { kind: 'vegetables', note: 'Colorful dinner' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      actor: { userId: owner.user.id, displayName: 'Jane' },
      kind: 'vegetables',
      note: 'Colorful dinner',
    });
    expect(created.json()).not.toHaveProperty('weightKg');

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/activities',
      headers: auth(partner.accessToken),
      payload: { kind: 'encouragement' },
    });
    expect(second.statusCode).toBe(201);

    const partnerFeed = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/feed?limit=20',
      headers: auth(partner.accessToken),
    });
    expect(partnerFeed.statusCode).toBe(200);
    expect(partnerFeed.json().activities.map((item: { id: string }) => item.id)).toEqual([
      second.json().id,
      created.json().id,
    ]);

    const outsiderFeed = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/feed',
      headers: auth(outsider.accessToken),
    });
    expect(outsiderFeed.statusCode).toBe(409);

    const afterCreated = await app.inject({
      method: 'GET',
      url: `/api/v1/progress/feed?since=${encodeURIComponent(created.json().createdAt)}`,
      headers: auth(partner.accessToken),
    });
    expect(afterCreated.json().activities.map((item: { id: string }) => item.id)).toEqual([
      created.json().id,
      second.json().id,
    ]);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/couples/me',
      headers: auth(partner.accessToken),
    });
    const formerMemberFeed = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/feed',
      headers: auth(partner.accessToken),
    });
    expect(formerMemberFeed.statusCode).toBe(409);
  });
});
