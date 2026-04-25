import { z } from 'zod';

export const LocaleSchema = z.enum(['he', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

export const GenderSchema = z.enum(['female', 'male', 'other']);
export type Gender = z.infer<typeof GenderSchema>;

export const ActivityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'high',
  'athlete',
]);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const GoalTypeSchema = z.enum(['lose', 'maintain', 'gain']);
export type GoalType = z.infer<typeof GoalTypeSchema>;

/** Uuid alias used in every DTO id field. */
export const UuidSchema = z.string().uuid();
