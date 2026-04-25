import { z } from 'zod';
import { LocaleSchema } from './common.js';

/**
 * Minimum password length enforced on both sides. 10 chars strikes a balance
 * between usability and resistance to online guessing (combined with server-
 * side rate limiting and bcrypt cost 12).
 */
export const MIN_PASSWORD_LENGTH = 10;

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('invalid email')
  .max(254);

export const PasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(256);

export const RegisterInputSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    displayName: z.string().trim().min(1).max(60),
    locale: LocaleSchema.default('he'),
  })
  .strict();
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
  })
  .strict();
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthTokensSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresInSeconds: z.number().int().positive(),
  })
  .strict();
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
