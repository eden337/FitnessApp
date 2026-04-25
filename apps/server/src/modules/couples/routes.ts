import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { JoinCoupleInputSchema } from '@fitnessapp/shared';
import type { CoupleError, CouplesService } from './service.js';

const errorToHttp = (e: CoupleError): { status: number; code: string; message: string } => {
  switch (e.kind) {
    case 'already_in_couple':
      return { status: 409, code: 'already_in_couple', message: 'already a member of a couple' };
    case 'invite_not_found':
      return { status: 404, code: 'invite_not_found', message: 'invite code not recognized' };
    case 'self_join_forbidden':
      return { status: 409, code: 'self_join_forbidden', message: 'already in this couple' };
    case 'not_a_member':
      return { status: 404, code: 'not_a_member', message: 'not in any couple' };
  }
};

export const registerCouplesRoutes = (
  app: FastifyInstance,
  deps: {
    service: CouplesService;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  },
): void => {
  const { service, requireAuth } = deps;

  app.get('/api/v1/couples/me', { preHandler: requireAuth }, async (req, reply) => {
    const view = await service.getMyView(req.userId!);
    return reply.send({ view });
  });

  app.post('/api/v1/couples', { preHandler: requireAuth }, async (req, reply) => {
    const result = await service.create(req.userId!);
    if ('kind' in result) {
      const e = errorToHttp(result);
      return reply.code(e.status).send({ error: { code: e.code, message: e.message } });
    }
    return reply.code(201).send(result);
  });

  app.post('/api/v1/couples/join', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = JoinCoupleInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'invalid_body', message: parsed.error.message } });
    }
    const result = await service.join(req.userId!, parsed.data.inviteCode);
    if ('kind' in result) {
      const e = errorToHttp(result);
      return reply.code(e.status).send({ error: { code: e.code, message: e.message } });
    }
    return reply.code(200).send(result);
  });

  app.delete('/api/v1/couples/me', { preHandler: requireAuth }, async (req, reply) => {
    const result = await service.leave(req.userId!);
    if ('kind' in result) {
      const e = errorToHttp(result);
      return reply.code(e.status).send({ error: { code: e.code, message: e.message } });
    }
    return reply.code(200).send(result);
  });
};
