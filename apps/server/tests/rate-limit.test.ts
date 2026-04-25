import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { closeTestDb, getTestDb, truncateAll, validRegisterPayload } from './helpers/test-app.js';

/**
 * Rate-limit hardening lives next to the auth routes; here we build a
 * dedicated app with rate limiting **enabled** (via NODE_ENV != 'test') and
 * verify that a sixth request inside the window is rejected with 429.
 */
describe('auth rate limiting', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await truncateAll();
    const env = loadEnv({
      NODE_ENV: 'development',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://fitnessapp:fitnessapp@localhost:5432/fitnessapp_test',
      BCRYPT_COST: '4',
      JWT_ACCESS_SECRET: 'test-access-secret-with-enough-entropy',
      JWT_REFRESH_SECRET: 'test-refresh-secret-with-enough-entropy',
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_TTL: '30d',
      CORS_ORIGINS: 'http://localhost:19006',
    } as NodeJS.ProcessEnv);
    app = await buildApp({ env, db: getTestDb() });
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  it('returns 429 once the per-IP register limit is exceeded', async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, () =>
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/register',
          payload: validRegisterPayload(),
        }),
      ),
    );
    const codes = responses.map((r) => r.statusCode);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(1);
  });
});
