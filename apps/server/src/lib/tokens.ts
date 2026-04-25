import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

export type AccessTokenPayload = { sub: string };

export type TokenSigner = {
  signAccess: (userId: string) => { token: string; expiresInSeconds: number };
  verifyAccess: (token: string) => AccessTokenPayload;
  issueRefresh: () => { token: string; tokenHash: string; expiresAt: Date };
  hashRefresh: (token: string) => string;
};

export type TokenSignerConfig = {
  accessSecret: string;
  refreshTtlSeconds: number;
  accessTtlSeconds: number;
};

/**
 * JWT access tokens are signed/verified here; refresh tokens are random
 * 256-bit strings that we hash with SHA-256 before storing in the DB. We
 * deliberately do NOT use bcrypt for refresh tokens — bcrypt is for
 * low-entropy human passwords; SHA-256 is appropriate for high-entropy
 * random secrets and is much faster, which matters because every API call
 * with a Bearer token may trigger a refresh-token lookup.
 */
export const createTokenSigner = ({
  accessSecret,
  accessTtlSeconds,
  refreshTtlSeconds,
}: TokenSignerConfig): TokenSigner => {
  const hashRefresh = (token: string): string =>
    createHash('sha256').update(token).digest('hex');

  return {
    signAccess: (userId) => ({
      token: jwt.sign({ sub: userId }, accessSecret, {
        algorithm: 'HS256',
        expiresIn: accessTtlSeconds,
      }),
      expiresInSeconds: accessTtlSeconds,
    }),

    verifyAccess: (token) => {
      const decoded = jwt.verify(token, accessSecret, { algorithms: ['HS256'] });
      if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
        throw new Error('invalid access token payload');
      }
      return { sub: decoded.sub };
    },

    issueRefresh: () => {
      const token = randomBytes(48).toString('base64url');
      const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);
      return { token, tokenHash: hashRefresh(token), expiresAt };
    },

    hashRefresh,
  };
};

/** Parse a TTL string like "15m" / "30d" / "3600" into seconds. */
export const parseTtlToSeconds = (ttl: string): number => {
  const match = ttl.match(/^(\d+)\s*([smhd])?$/i);
  if (!match) throw new Error(`invalid TTL: ${ttl}`);
  const n = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return n * multiplier;
};
