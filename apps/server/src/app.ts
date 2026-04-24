import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import type { Env } from './config/env.js';

export type AppDeps = {
  env: Env;
};

/**
 * Build a fully-wired Fastify instance without starting the HTTP listener.
 * Keeping startup separate from wiring lets tests exercise the app via
 * `app.inject(...)` or Supertest without binding a port.
 */
export const buildApp = async ({ env }: AppDeps): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: 'info' },
    trustProxy: true,
  });

  await app.register(helmet, { global: true });
  await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true });
  await app.register(sensible);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'fitnessapp-server',
    env: env.NODE_ENV,
  }));

  return app;
};
