import { z } from 'zod';
import { UuidSchema } from './common.js';

export const SharedActivityKindSchema = z.enum([
  'hydration',
  'vegetables',
  'movement',
  'meal_together',
  'encouragement',
]);
export type SharedActivityKind = z.infer<typeof SharedActivityKindSchema>;

export const CreateSharedActivityInputSchema = z
  .object({
    kind: SharedActivityKindSchema,
    note: z.string().trim().min(1).max(160).optional(),
  })
  .strict();
export type CreateSharedActivityInput = z.infer<typeof CreateSharedActivityInputSchema>;

export const SharedActivitySchema = z
  .object({
    id: UuidSchema,
    coupleId: UuidSchema,
    actor: z
      .object({
        userId: UuidSchema,
        displayName: z.string().min(1).max(80),
      })
      .strict(),
    kind: SharedActivityKindSchema,
    note: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type SharedActivity = z.infer<typeof SharedActivitySchema>;

export const SharedActivityFeedQuerySchema = z
  .object({
    since: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .strict();
export type SharedActivityFeedQuery = z.infer<typeof SharedActivityFeedQuerySchema>;

export const SharedActivityFeedResponseSchema = z
  .object({ activities: z.array(SharedActivitySchema) })
  .strict();
export type SharedActivityFeedResponse = z.infer<typeof SharedActivityFeedResponseSchema>;
