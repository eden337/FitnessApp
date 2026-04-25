import { z } from 'zod';

/**
 * Single source of truth for server configuration. All env access MUST go
 * through this module so that a missing or malformed variable fails loudly
 * at boot rather than mysteriously at runtime.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_HOST: z.string().default('0.0.0.0'),
  SERVER_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me-please'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me-please'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:19006,http://localhost:8081')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env =>
  EnvSchema.parse(source);
