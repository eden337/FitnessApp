import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateSharedActivityInputSchema,
  SharedActivityFeedQuerySchema,
} from '@fitnessapp/shared';
import type { ActivitiesService } from './service.js';

export const registerActivitiesRoutes = (
  app: FastifyInstance,
  deps: {
    service: ActivitiesService;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    enableRateLimit?: boolean;
  },
): void => {
  app.post(
    '/api/v1/progress/activities',
    {
      preHandler: deps.requireAuth,
      ...(deps.enableRateLimit === false
        ? {}
        : { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }),
    },
    async (req, reply) => {
      const parsed = CreateSharedActivityInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: { code: 'invalid_body', message: parsed.error.message } });
      }
      const result = await deps.service.create(req.userId!, parsed.data);
      if ('kind' in result && result.kind === 'not_paired') {
        return reply.code(409).send({
          error: { code: 'not_paired', message: 'join a partner before sharing wins' },
        });
      }
      return reply.code(201).send(result);
    },
  );

  app.get(
    '/api/v1/progress/feed',
    { preHandler: deps.requireAuth },
    async (req, reply) => {
      const parsed = SharedActivityFeedQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: { code: 'invalid_query', message: parsed.error.message } });
      }
      const result = await deps.service.feed(req.userId!, parsed.data);
      if ('kind' in result && result.kind === 'not_paired') {
        return reply.code(409).send({
          error: { code: 'not_paired', message: 'join a partner to view shared wins' },
        });
      }
      return reply.send(result);
    },
  );
};
