import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import type { Env } from './config/env.js';
import { createDbClient, type DbClient } from './db/client.js';
import { createPasswordHasher } from './lib/password.js';
import { createTokenSigner, parseTtlToSeconds } from './lib/tokens.js';
import { buildRequireAuth } from './middleware/requireAuth.js';
import { createAuthRepo } from './modules/auth/repo.js';
import { createAuthService } from './modules/auth/service.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { createUsersRepo } from './modules/users/repo.js';
import { createUsersService } from './modules/users/service.js';
import { registerUsersRoutes } from './modules/users/routes.js';

export type AppDeps = {
  env: Env;
  /**
   * Optional pre-built DB client. If omitted and `env.DATABASE_URL` is set,
   * a client is created. This indirection lets tests inject a connection
   * pinned to an isolated schema.
   */
  db?: DbClient;
};

/**
 * Build a fully-wired Fastify instance without starting the HTTP listener.
 * Keeping startup separate from wiring lets tests exercise the app via
 * `app.inject(...)` or Supertest without binding a port.
 */
export const buildApp = async ({ env, db: providedDb }: AppDeps): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: 'info' },
    trustProxy: true,
  });

  await app.register(helmet, { global: true });
  await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true });
  await app.register(sensible);
  await app.register(rateLimit, { global: false, max: 60, timeWindow: '1 minute' });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'fitnessapp-server',
    env: env.NODE_ENV,
  }));

  // Wire the auth + users stack only when we have a database (tests for the
  // health endpoint don't need it).
  const db = providedDb ?? (env.DATABASE_URL ? createDbClient(env.DATABASE_URL) : null);
  if (db) {
    const hasher = createPasswordHasher(env.BCRYPT_COST);
    const signer = createTokenSigner({
      accessSecret: env.JWT_ACCESS_SECRET,
      accessTtlSeconds: parseTtlToSeconds(env.JWT_ACCESS_TTL),
      refreshTtlSeconds: parseTtlToSeconds(env.JWT_REFRESH_TTL),
    });
    const requireAuth = buildRequireAuth(signer);

    const authRepo = createAuthRepo(db);
    const authService = createAuthService({ repo: authRepo, hasher, signer });
    registerAuthRoutes(app, {
      service: authService,
      requireAuth,
      options: { enableRateLimit: env.NODE_ENV !== 'test' },
    });

    const usersRepo = createUsersRepo(db);
    const usersService = createUsersService({ repo: usersRepo, authRepo });
    registerUsersRoutes(app, { service: usersService, requireAuth });

    app.addHook('onClose', async () => {
      if (!providedDb) await db.destroy();
    });
  }

  return app;
};
