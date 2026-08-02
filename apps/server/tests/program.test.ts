import type { FastifyInstance } from 'fastify';
import { applySeedBundle, readSeedBundle } from '../src/db/seedLoader.js';
import {
  buildTestApp,
  closeTestDb,
  getTestDb,
  truncateAll,
  validRegisterPayload,
} from './helpers/test-app.js';

const metrics = {
  currentWeightKg: 80,
  activityLevel: 'moderate',
  goalType: 'lose',
  goalWeightKg: 72,
  dietaryRestrictions: {},
};

describe('program routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await applySeedBundle(getTestDb(), await readSeedBundle('v1'));
  });

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

  const createUser = async (): Promise<string> => {
    const register = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validRegisterPayload(),
    });
    expect(register.statusCode).toBe(201);
    const token = register.json<{ accessToken: string }>().accessToken;
    const setupMetrics = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/metrics',
      headers: { authorization: `Bearer ${token}` },
      payload: metrics,
    });
    expect(setupMetrics.statusCode).toBe(200);
    return token;
  };

  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/program/me/current' });
    expect(response.statusCode).toBe(401);
  });

  it('previews seeded week 1 before start', async () => {
    const token = await createUser();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/program/me/current',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        status: 'not_started',
        scheduledWeekNumber: 1,
        contentWeekNumber: 1,
        isFallback: false,
        week: expect.objectContaining({ weekNumber: 1 }),
      }),
    );
  });

  it('starts from a selected week and rejects restart', async () => {
    const token = await createUser();
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/program/me/start',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentWeekNumber: 11 },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toEqual(
      expect.objectContaining({
        scheduledWeekNumber: 11,
        contentWeekNumber: 10,
        isFallback: true,
      }),
    );

    const again = await app.inject({
      method: 'POST',
      url: '/api/v1/program/me/start',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentWeekNumber: 1 },
    });
    expect(again.statusCode).toBe(409);
    expect(again.json().error.code).toBe('already_started');
  });

  it('validates start body and list query', async () => {
    const token = await createUser();
    const invalidStart = await app.inject({
      method: 'POST',
      url: '/api/v1/program/me/start',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentWeekNumber: 14 },
    });
    const invalidQuery = await app.inject({
      method: 'GET',
      url: '/api/v1/program/lists?weekNumber=nope',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(invalidStart.statusCode).toBe(400);
    expect(invalidQuery.statusCode).toBe(400);
  });

  it('returns global lists and the selected week-scoped list in stable order', async () => {
    const token = await createUser();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/program/lists?weekNumber=3',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = response.json<{
      scheduledWeekNumber: number;
      lists: { slug: string; weekNumber: number | null; items: unknown[] }[];
    }>();

    expect(response.statusCode).toBe(200);
    expect(body.scheduledWeekNumber).toBe(3);
    expect(body.lists.map((list) => list.slug)).toEqual(
      [...body.lists.map((list) => list.slug)].sort(),
    );
    expect(body.lists.find((list) => list.slug === 'cleanse-vacation')?.weekNumber).toBe(3);
    expect(body.lists.find((list) => list.slug === 'cleansing-vegetables')?.items).toHaveLength(
      34,
    );
  });
});
