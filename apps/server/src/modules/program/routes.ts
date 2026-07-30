import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ProgramListsQuerySchema, StartProgramInputSchema } from '@fitnessapp/shared';
import type { ProgramService } from './service.js';

export const registerProgramRoutes = (
  app: FastifyInstance,
  deps: {
    service: ProgramService;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    enableRateLimit?: boolean;
  },
): void => {
  const { service, requireAuth } = deps;
  const startOptions = {
    preHandler: requireAuth,
    ...(deps.enableRateLimit === false
      ? {}
      : { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }),
  };

  app.get('/api/v1/program/me/current', { preHandler: requireAuth }, async (req, reply) =>
    reply.send(await service.getCurrent(req.userId!)),
  );

  app.post('/api/v1/program/me/start', startOptions, async (req, reply) => {
    const parsed = StartProgramInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await service.start(req.userId!, parsed.data);
    if ('kind' in result) {
      if (result.kind === 'already_started') {
        return reply
          .code(409)
          .send({ error: { code: result.kind, message: 'program already started' } });
      }
      return reply
        .code(409)
        .send({ error: { code: result.kind, message: 'profile metrics must be set up first' } });
    }
    return reply.code(201).send(result);
  });

  app.get('/api/v1/program/lists', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = ProgramListsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_query', message: parsed.error.message } });
    }
    return reply.send(await service.getFoodLists(req.userId!, parsed.data.weekNumber));
  });
};
