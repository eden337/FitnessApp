import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  ProfileSetupInputSchema,
  UpdateMetricsInputSchema,
  UpdateProfileInputSchema,
  UserMetricsSchema,
} from '@fitnessapp/shared';
import type { UsersService } from './service.js';

export const registerUsersRoutes = (
  app: FastifyInstance,
  deps: {
    service: UsersService;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  },
): void => {
  const { service, requireAuth } = deps;

  app.get('/api/v1/users/me/profile', { preHandler: requireAuth }, async (req, reply) => {
    const full = await service.getFullProfile(req.userId!);
    if (!full) return reply.code(404).send({ error: { code: 'not_found', message: 'user not found' } });
    return reply.send(full);
  });

  app.patch('/api/v1/users/me/profile', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = UpdateProfileInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const full = await service.updateProfile(req.userId!, parsed.data);
    if (!full) return reply.code(404).send({ error: { code: 'not_found', message: 'user not found' } });
    return reply.send(full);
  });

  app.patch('/api/v1/users/me/metrics', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = UpdateMetricsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const full = await service.updateMetrics(req.userId!, parsed.data);
    if (!full) {
      return reply
        .code(409)
        .send({ error: { code: 'metrics_not_initialized', message: 'call setup first' } });
    }
    return reply.send(full);
  });

  // Initial setup: writes a full UserMetrics record (or replaces existing).
  app.put('/api/v1/users/me/metrics', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = ProfileSetupInputSchema.safeParse(req.body);
    if (!parsed.success) {
      // Allow callers to also send a strict UserMetrics (without profile fields).
      const fallback = UserMetricsSchema.safeParse(req.body);
      if (!fallback.success) {
        return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
      }
      const full = await service.setupMetrics(req.userId!, fallback.data);
      if (!full) return reply.code(404).send({ error: { code: 'not_found', message: 'user not found' } });
      return reply.code(200).send(full);
    }
    // Setup may also update profile (gender/birthDate/heightCm) in one call.
    const { gender, birthDate, heightCm, ...metrics } = parsed.data;
    await service.updateProfile(req.userId!, { gender, birthDate, heightCm });
    const full = await service.setupMetrics(req.userId!, metrics);
    if (!full) return reply.code(404).send({ error: { code: 'not_found', message: 'user not found' } });
    return reply.code(200).send(full);
  });
};
