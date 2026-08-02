import { z } from 'zod';
import { UuidSchema } from './common.js';
import { DateOnlySchema, WeightKgSchema } from './user.js';

export const BodyFatPctSchema = z.number().min(3).max(75);

export const CreateWeightLogInputSchema = z
  .object({
    loggedOn: DateOnlySchema.optional(),
    weightKg: WeightKgSchema,
    bodyFatPct: BodyFatPctSchema.optional(),
    notes: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type CreateWeightLogInput = z.infer<typeof CreateWeightLogInputSchema>;

export const WeightLogSchema = z
  .object({
    id: UuidSchema,
    loggedOn: DateOnlySchema,
    weightKg: WeightKgSchema,
    bodyFatPct: BodyFatPctSchema.nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type WeightLog = z.infer<typeof WeightLogSchema>;

export const WeightHistoryQuerySchema = z
  .object({
    from: DateOnlySchema.optional(),
    to: DateOnlySchema.optional(),
    limit: z.coerce.number().int().min(1).max(365).default(90),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.from > value.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: 'from must not be after to',
      });
    }
  });
export type WeightHistoryQuery = z.infer<typeof WeightHistoryQuerySchema>;

export const WeightHistoryResponseSchema = z
  .object({
    logs: z.array(WeightLogSchema),
  })
  .strict();
export type WeightHistoryResponse = z.infer<typeof WeightHistoryResponseSchema>;
