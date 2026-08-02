import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateWeightLogInputSchema,
  WeightHistoryQuerySchema,
} from '@fitnessapp/shared';
import type { ProgressService } from './service.js';

export const registerProgressRoutes = (
  app: FastifyInstance,
  deps: {
    service: ProgressService;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    enableRateLimit?: boolean;
  },
): void => {
  const writeOptions = {
    preHandler: deps.requireAuth,
    ...(deps.enableRateLimit === false
      ? {}
      : { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }),
  };

  app.post('/api/v1/progress/weight', writeOptions, async (req, reply) => {
    const parsed = CreateWeightLogInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await deps.service.logWeight(req.userId!, parsed.data);
    if ('kind' in result) {
      const isFutureDate = result.kind === 'future_date';
      return reply.code(isFutureDate ? 400 : 409).send({
        error: {
          code: result.kind,
          message:
            result.kind === 'maintenance_only'
              ? 'weight tracking is available after the foundation program'
              : isFutureDate
                ? 'weight measurements cannot be dated in the future'
                : 'profile metrics must be set up first',
        },
      });
    }
    return reply.send(result);
  });

  app.get(
    '/api/v1/progress/weight',
    { preHandler: deps.requireAuth },
    async (req, reply) => {
      const parsed = WeightHistoryQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: { code: 'invalid_query', message: parsed.error.message } });
      }
      const result = await deps.service.getWeightHistory(req.userId!, parsed.data);
      if ('kind' in result) {
        return reply.code(409).send({
          error: {
            code: result.kind,
            message: 'weight tracking is available after the foundation program',
          },
        });
      }
      return reply.send(result);
    },
  );
};
