import type { FastifyInstance } from 'fastify';
import { sql } from 'kysely';
import { buildApp } from '../../src/app.js';
import { loadEnv } from '../../src/config/env.js';
import { createDbClient, type DbClient } from '../../src/db/client.js';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://fitnessapp:fitnessapp@localhost:5432/fitnessapp_test';

let sharedDb: DbClient | null = null;

/**
 * Returns a process-wide Kysely client pinned to the test database.
 * Tests TRUNCATE between cases instead of recreating the schema, which is
 * many times faster than spinning the migration runner per test.
 */
export const getTestDb = (): DbClient => {
  if (!sharedDb) sharedDb = createDbClient(TEST_DATABASE_URL);
  return sharedDb;
};

export const closeTestDb = async (): Promise<void> => {
  if (sharedDb) {
    await sharedDb.destroy();
    sharedDb = null;
  }
};

export const truncateAll = async (): Promise<void> => {
  const db = getTestDb();
  await sql`TRUNCATE TABLE refresh_tokens, user_metrics, users RESTART IDENTITY CASCADE`.execute(db);
};

/**
 * Build a Fastify instance wired against the shared test DB. Bcrypt cost is
 * forced to 4 so tests stay fast.
 */
export const buildTestApp = async (): Promise<FastifyInstance> => {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    BCRYPT_COST: '4',
    JWT_ACCESS_SECRET: 'test-access-secret-with-enough-entropy',
    JWT_REFRESH_SECRET: 'test-refresh-secret-with-enough-entropy',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '30d',
    CORS_ORIGINS: 'http://localhost:19006',
  } as NodeJS.ProcessEnv);
  return buildApp({ env, db: getTestDb() });
};

export const validRegisterPayload = (overrides: Partial<Record<string, unknown>> = {}) => ({
  email: `user+${Math.random().toString(36).slice(2, 10)}@example.com`,
  password: 'sup3rS3cret-pw',
  displayName: 'Test User',
  locale: 'he',
  gender: 'female',
  birthDate: '1990-04-15',
  heightCm: 165,
  ...overrides,
});
