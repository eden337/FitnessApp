import { z } from 'zod';
import {
  ActivityLevelSchema,
  GenderSchema,
  GoalTypeSchema,
  LocaleSchema,
  UuidSchema,
} from './common.js';

/** Real ISO YYYY-MM-DD calendar date. Server stores DATE; client renders. */
export const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, 'expected a valid calendar date');

export const HeightCmSchema = z.number().int().min(50).max(250);
export const WeightKgSchema = z.number().positive().min(20).max(300);

export const DietaryRestrictionsSchema = z
  .object({
    kosher: z.boolean().optional(),
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    allergies: z.array(z.string().min(1).max(40)).max(20).optional(),
  })
  .strict();
export type DietaryRestrictions = z.infer<typeof DietaryRestrictionsSchema>;

export const UserProfileSchema = z
  .object({
    id: UuidSchema,
    email: z.string().email(),
    displayName: z.string(),
    locale: LocaleSchema,
    gender: GenderSchema,
    birthDate: DateOnlySchema,
    heightCm: HeightCmSchema,
  })
  .strict();
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserMetricsSchema = z
  .object({
    currentWeightKg: WeightKgSchema,
    activityLevel: ActivityLevelSchema,
    goalType: GoalTypeSchema,
    goalWeightKg: WeightKgSchema.nullable(),
    dietaryRestrictions: DietaryRestrictionsSchema,
  })
  .strict();
export type UserMetrics = z.infer<typeof UserMetricsSchema>;

export const DerivedUserMetricsSchema = z
  .object({
    ageYears: z.number().int().min(0),
    bmi: z.number().positive(),
    bmrKcal: z.number(),
    tdeeKcal: z.number(),
    targetKcal: z.number(),
  })
  .strict();
export type DerivedUserMetrics = z.infer<typeof DerivedUserMetricsSchema>;

/** Input schemas (PATCH = partial of editable fields). */
export const UpdateProfileInputSchema = UserProfileSchema.pick({
  displayName: true,
  locale: true,
  gender: true,
  birthDate: true,
  heightCm: true,
})
  .partial()
  .strict();
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const UpdateMetricsInputSchema = UserMetricsSchema.partial().strict();
export type UpdateMetricsInput = z.infer<typeof UpdateMetricsInputSchema>;

/** Combined registration input that establishes both profile and initial metrics. */
export const ProfileSetupInputSchema = z
  .object({
    gender: GenderSchema,
    birthDate: DateOnlySchema,
    heightCm: HeightCmSchema,
    currentWeightKg: WeightKgSchema,
    activityLevel: ActivityLevelSchema,
    goalType: GoalTypeSchema,
    goalWeightKg: WeightKgSchema.nullable().default(null),
    dietaryRestrictions: DietaryRestrictionsSchema.default({}),
  })
  .strict();
export type ProfileSetupInput = z.infer<typeof ProfileSetupInputSchema>;
