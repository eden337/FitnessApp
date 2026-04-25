import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

const registerAndLogin = async (
  app: FastifyInstance,
  overrides: Partial<Record<string, unknown>> = {},
): Promise<{ accessToken: string; userId: string; email: string }> => {
  const payload = validRegisterPayload(overrides);
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
  const body = res.json();
  return { accessToken: body.accessToken, userId: body.user.id, email: payload.email as string };
};

describe('users module', () => {
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

  describe('GET /users/me/profile', () => {
    it('returns the profile with null metrics until setup', async () => {
      const { accessToken, email } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/profile',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.profile.email).toBe(email);
      expect(body.metrics).toBeNull();
      expect(body.derived).toBeNull();
    });

    it('rejects unauthenticated callers', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/users/me/profile' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /users/me/metrics (initial setup)', () => {
    it('writes metrics + recomputes derived (BMR/TDEE/target)', async () => {
      const { accessToken } = await registerAndLogin(app, {
        gender: 'male',
        birthDate: '1990-01-01',
        heightCm: 180,
      });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          gender: 'male',
          birthDate: '1990-01-01',
          heightCm: 180,
          currentWeightKg: 80,
          activityLevel: 'moderate',
          goalType: 'lose',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.metrics.currentWeightKg).toBe(80);
      expect(body.derived.ageYears).toBeGreaterThanOrEqual(35);
      expect(body.derived.bmrKcal).toBeGreaterThan(1500);
      expect(body.derived.tdeeKcal).toBeGreaterThan(body.derived.bmrKcal);
      expect(body.derived.targetKcal).toBeLessThan(body.derived.tdeeKcal);
    });

    it('also accepts a strict UserMetrics body without profile fields', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          currentWeightKg: 70,
          activityLevel: 'light',
          goalType: 'maintain',
          goalWeightKg: null,
          dietaryRestrictions: { kosher: true },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().metrics.dietaryRestrictions).toEqual({ kosher: true });
    });

    it('returns 400 on bogus body', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { currentWeightKg: -5 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /users/me/profile', () => {
    it('partial-updates display name and locale', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/profile',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { displayName: 'New Name', locale: 'en' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().profile.displayName).toBe('New Name');
      expect(res.json().profile.locale).toBe('en');
    });

    it('rejects extra fields', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/profile',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { hacker: true },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /users/me/metrics', () => {
    it('returns 400 on a malformed PATCH body', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { currentWeightKg: -1 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 409 before metrics have been initialized', async () => {
      const { accessToken } = await registerAndLogin(app);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { currentWeightKg: 70 },
      });
      expect(res.statusCode).toBe(409);
    });

    it('updates a single field after setup', async () => {
      const { accessToken } = await registerAndLogin(app);
      // setup
      await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          currentWeightKg: 70,
          activityLevel: 'light',
          goalType: 'maintain',
          goalWeightKg: null,
          dietaryRestrictions: {},
        },
      });
      // patch
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { currentWeightKg: 71.5 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().metrics.currentWeightKg).toBe(71.5);
    });

    it('updates every metrics field at once (covers full patch path)', async () => {
      const { accessToken } = await registerAndLogin(app);
      await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          currentWeightKg: 70,
          activityLevel: 'light',
          goalType: 'maintain',
          goalWeightKg: null,
          dietaryRestrictions: {},
        },
      });
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/metrics',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          currentWeightKg: 68.2,
          activityLevel: 'moderate',
          goalType: 'lose',
          goalWeightKg: 64,
          dietaryRestrictions: { vegetarian: true, allergies: ['sesame'] },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.metrics).toMatchObject({
        currentWeightKg: 68.2,
        activityLevel: 'moderate',
        goalType: 'lose',
        goalWeightKg: 64,
        dietaryRestrictions: { vegetarian: true, allergies: ['sesame'] },
      });
    });
  });
});
