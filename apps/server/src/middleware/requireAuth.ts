import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TokenSigner } from '../lib/tokens.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Populated by `requireAuth` once the access token has been verified. */
    userId?: string;
  }
}

/**
 * Build a Fastify pre-handler that requires a valid Bearer access token.
 * Pulled out as a factory so it can close over the configured token signer
 * without using module-level globals (and so tests can supply a fake signer).
 */
export const buildRequireAuth = (signer: TokenSigner) =>
  async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      await reply.code(401).send({ error: { code: 'unauthenticated', message: 'missing bearer token' } });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const { sub } = signer.verifyAccess(token);
      req.userId = sub;
    } catch {
      await reply.code(401).send({ error: { code: 'unauthenticated', message: 'invalid or expired token' } });
    }
  };
