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
import { createCouplesRepo } from './modules/couples/repo.js';
import { createCouplesService, type CoupleEventEmitter } from './modules/couples/service.js';
import { registerCouplesRoutes } from './modules/couples/routes.js';
import { createSyncGateway, type SyncGateway } from './modules/sync/gateway.js';
import { createProgramRepo } from './modules/program/repo.js';
import { createProgramService } from './modules/program/service.js';
import { registerProgramRoutes } from './modules/program/routes.js';
import { createProgressRepo } from './modules/progress/repo.js';
import { createProgressService } from './modules/progress/service.js';
import { registerProgressRoutes } from './modules/progress/routes.js';
import { createActivitiesRepo } from './modules/activities/repo.js';
import { createActivitiesService } from './modules/activities/service.js';
import { registerActivitiesRoutes } from './modules/activities/routes.js';

export type AppDeps = {
  env: Env;
  /**
   * Optional pre-built DB client. If omitted and `env.DATABASE_URL` is set,
   * a client is created. This indirection lets tests inject a connection
   * pinned to an isolated schema.
   */
  db?: DbClient;
  /**
   * When `true`, attach a Socket.IO gateway to the app's HTTP listener.
   * Defaults to `false` so unit tests using `app.inject()` don't pay the
   * cost of creating sockets they never use; the live entry point and the
   * dedicated socket tests opt in explicitly.
   */
  attachSync?: boolean;
};

export type BuiltApp = {
  app: FastifyInstance;
  sync: SyncGateway | null;
};

/**
 * Build a fully-wired Fastify instance without starting the HTTP listener.
 * Keeping startup separate from wiring lets tests exercise the app via
 * `app.inject(...)` or Supertest without binding a port.
 */
export const buildApp = async ({ env, db: providedDb }: AppDeps): Promise<FastifyInstance> => {
  const deps: AppDeps = { env, attachSync: false };
  if (providedDb) deps.db = providedDb;
  const built = await buildAppWithSync(deps);
  return built.app;
};

export const buildAppWithSync = async ({
  env,
  db: providedDb,
  attachSync = false,
}: AppDeps): Promise<BuiltApp> => {
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
  let sync: SyncGateway | null = null;
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

    // Couples + realtime sync. The gateway is created lazily so the same
    // emitter reference is shared between REST writes and socket fan-out.
    const eventsRef: { current: CoupleEventEmitter | null } = { current: null };
    const couplesRepo = createCouplesRepo(db);
    const couplesService = createCouplesService({
      repo: couplesRepo,
      authRepo,
      events: {
        emitMemberJoined: (id, p) => eventsRef.current?.emitMemberJoined(id, p),
        emitMemberLeft: (id, p) => eventsRef.current?.emitMemberLeft(id, p),
      },
    });
    registerCouplesRoutes(app, { service: couplesService, requireAuth });

    const programRepo = createProgramRepo(db);
    const programService = createProgramService({ repo: programRepo });
    registerProgramRoutes(app, {
      service: programService,
      requireAuth,
      enableRateLimit: env.NODE_ENV !== 'test',
    });

    const progressRepo = createProgressRepo(db);
    const progressService = createProgressService({ repo: progressRepo });
    registerProgressRoutes(app, {
      service: progressService,
      requireAuth,
      enableRateLimit: env.NODE_ENV !== 'test',
    });

    const activitiesRepo = createActivitiesRepo(db);
    const activitiesService = createActivitiesService(activitiesRepo);
    registerActivitiesRoutes(app, {
      service: activitiesService,
      requireAuth,
      enableRateLimit: env.NODE_ENV !== 'test',
    });

    if (attachSync) {
      // The Socket.IO server attaches to the underlying HTTP listener; we
      // can only do that after `app.ready()` has run, so callers must call
      // `attachSocket()` once they've called `await app.ready()`.
      app.addHook('onReady', async () => {
        sync = createSyncGateway({ app, signer, couplesService });
        eventsRef.current = sync.emitter;
      });
      app.addHook('onClose', async () => {
        if (sync) await sync.close();
      });
    }

    app.addHook('onClose', async () => {
      if (!providedDb) await db.destroy();
    });
  }

  // The caller can read `built.sync` only after `await app.ready()`; before
  // that the gateway hasn't attached.
  return {
    app,
    get sync() {
      return sync;
    },
  } as BuiltApp;
};
