import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

const metrics = {
  currentWeightKg: 82,
  activityLevel: 'moderate',
  goalType: 'lose',
  goalWeightKg: 74,
  dietaryRestrictions: {},
};

describe('weight progress routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await truncateAll();
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const createUser = async (withMetrics = true): Promise<string> => {
    const register = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validRegisterPayload(),
    });
    expect(register.statusCode).toBe(201);
    const token = register.json<{ accessToken: string }>().accessToken;
    if (withMetrics) {
      const setupMetrics = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${token}` },
        payload: metrics,
      });
      expect(setupMetrics.statusCode).toBe(200);
    }
    return token;
  };

  it('requires authentication for writes and history', async () => {
    const write = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      payload: { weightKg: 81 },
    });
    const read = await app.inject({ method: 'GET', url: '/api/v1/progress/weight' });

    expect(write.statusCode).toBe(401);
    expect(read.statusCode).toBe(401);
  });

  it('requires initialized metrics and validates inputs', async () => {
    const token = await createUser(false);
    const headers = { authorization: `Bearer ${token}` };
    const missingMetrics = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      headers,
      payload: { weightKg: 81 },
    });
    const invalidBody = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      headers,
      payload: { weightKg: 500 },
    });
    const futureDate = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      headers,
      payload: { loggedOn: '9999-12-31', weightKg: 80 },
    });
    const invalidQuery = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/weight?limit=500',
      headers,
    });

    expect(missingMetrics.statusCode).toBe(409);
    expect(invalidBody.statusCode).toBe(400);
    expect(futureDate.statusCode).toBe(400);
    expect(invalidQuery.statusCode).toBe(400);
  });

  it('upserts one private measurement per calendar day', async () => {
    const ownerToken = await createUser();
    const otherToken = await createUser();
    const ownerHeaders = { authorization: `Bearer ${ownerToken}` };

    await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      headers: ownerHeaders,
      payload: { loggedOn: '2026-07-30', weightKg: 81.5 },
    });
    const updated = await app.inject({
      method: 'POST',
      url: '/api/v1/progress/weight',
      headers: ownerHeaders,
      payload: {
        loggedOn: '2026-07-30',
        weightKg: 81.2,
        bodyFatPct: 20.5,
        notes: 'Morning',
      },
    });
    const ownerHistory = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/weight',
      headers: ownerHeaders,
    });
    const otherHistory = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/weight',
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toEqual(
      expect.objectContaining({
        loggedOn: '2026-07-30',
        weightKg: 81.2,
        bodyFatPct: 20.5,
        notes: 'Morning',
      }),
    );
    expect(ownerHistory.json().logs).toHaveLength(1);
    expect(otherHistory.json().logs).toEqual([]);
  });

  it('returns bounded newest-first history and keeps the latest weight current', async () => {
    const token = await createUser();
    const headers = { authorization: `Bearer ${token}` };
    for (const entry of [
      { loggedOn: '2026-07-30', weightKg: 80 },
      { loggedOn: '2026-07-01', weightKg: 90 },
      { loggedOn: '2026-07-15', weightKg: 85 },
    ]) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/progress/weight',
        headers,
        payload: entry,
      });
    }

    const history = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/weight?from=2026-07-10&to=2026-07-30&limit=2',
      headers,
    });
    const profile = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers,
    });

    expect(history.json().logs.map((entry: { loggedOn: string }) => entry.loggedOn)).toEqual([
      '2026-07-30',
      '2026-07-15',
    ]);
    expect(profile.json().metrics.currentWeightKg).toBe(80);
  });
});
