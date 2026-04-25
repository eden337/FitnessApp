import type { FastifyInstance } from 'fastify';
import {
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
} from '@fitnessapp/shared';
import { z } from 'zod';
import type { AuthService } from './service.js';

/**
 * HTTP layer. Validates requests with shared zod schemas, delegates to the
 * service, and maps domain errors to HTTP status codes. No business rules
 * live here.
 */
export type AuthRoutesOptions = {
  /** When false, per-route rate limits are disabled. Defaults to true. */
  enableRateLimit?: boolean;
};

export const registerAuthRoutes = (
  app: FastifyInstance,
  deps: {
    service: AuthService;
    requireAuth: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
    options?: AuthRoutesOptions;
  },
): void => {
  const { service, requireAuth } = deps;
  const enableRateLimit = deps.options?.enableRateLimit ?? true;
  const authLimit = enableRateLimit
    ? { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }
    : {};

  // The shared register schema enforces the auth-side fields; profile fields
  // (gender/birthDate/heightCm) are needed for personalization and live in a
  // server-side extension schema below.
  const RegisterServerSchema = RegisterInputSchema.extend({
    gender: z.enum(['female', 'male', 'other']),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    heightCm: z.number().int().min(50).max(250),
  }).strict();

  app.post('/api/v1/auth/register', authLimit, async (req, reply) => {
    const parsed = RegisterServerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await service.register(parsed.data);
    if ('kind' in result) {
      return reply.code(409).send({ error: { code: result.kind, message: 'email already registered' } });
    }
    return reply.code(201).send(result);
  });

  app.post('/api/v1/auth/login', authLimit, async (req, reply) => {
    const parsed = LoginInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await service.login(parsed.data.email, parsed.data.password);
    if ('kind' in result) {
      return reply.code(401).send({ error: { code: 'invalid_credentials', message: 'wrong email or password' } });
    }
    return reply.send(result);
  });

  app.post('/api/v1/auth/refresh', async (req, reply) => {
    const parsed = RefreshInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await service.refresh(parsed.data.refreshToken);
    if ('kind' in result) {
      return reply.code(401).send({ error: { code: 'invalid_refresh', message: 'refresh token invalid or expired' } });
    }
    return reply.send(result);
  });

  app.post('/api/v1/auth/logout', async (req, reply) => {
    const parsed = RefreshInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    await service.logout(parsed.data.refreshToken);
    return reply.code(204).send();
  });

  app.get('/api/v1/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const userId = req.userId!;
    const me = await service.me(userId);
    if (!me) return reply.code(404).send({ error: { code: 'not_found', message: 'user not found' } });
    return reply.send(me);
  });
};
