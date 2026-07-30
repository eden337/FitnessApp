import { z } from 'zod';
import { UuidSchema } from './common.js';
import { DateOnlySchema } from './user.js';

export const ProgramWeekNumberSchema = z.number().int().min(1).max(13);
export type ProgramWeekNumber = z.infer<typeof ProgramWeekNumberSchema>;

export const BilingualTextSchema = z
  .object({
    he: z.string().min(1),
    en: z.string().min(1),
  })
  .strict();
export type BilingualText = z.infer<typeof BilingualTextSchema>;

export const ProgramTaskSchema = z
  .object({
    id: UuidSchema,
    ordinal: z.number().int().nonnegative(),
    kind: z.enum(['required', 'optional']),
    title: BilingualTextSchema,
    description: BilingualTextSchema.nullable(),
  })
  .strict();
export type ProgramTask = z.infer<typeof ProgramTaskSchema>;

export const ProgramWeekSchema = z
  .object({
    id: UuidSchema,
    weekNumber: ProgramWeekNumberSchema,
    slug: z.string().min(1),
    title: BilingualTextSchema,
    mission: BilingualTextSchema,
    rationale: BilingualTextSchema.nullable(),
    notes: BilingualTextSchema.nullable(),
    tasks: z.array(ProgramTaskSchema),
  })
  .strict();
export type ProgramWeek = z.infer<typeof ProgramWeekSchema>;

export const ProgramStatusSchema = z.enum(['not_started', 'active', 'completed']);
export type ProgramStatus = z.infer<typeof ProgramStatusSchema>;

export const CurrentProgramResponseSchema = z
  .object({
    status: ProgramStatusSchema,
    startedOn: DateOnlySchema.nullable(),
    scheduledWeekNumber: ProgramWeekNumberSchema,
    contentWeekNumber: ProgramWeekNumberSchema,
    isFallback: z.boolean(),
    week: ProgramWeekSchema,
  })
  .strict();
export type CurrentProgramResponse = z.infer<typeof CurrentProgramResponseSchema>;

export const StartProgramInputSchema = z
  .object({
    currentWeekNumber: ProgramWeekNumberSchema,
  })
  .strict();
export type StartProgramInput = z.infer<typeof StartProgramInputSchema>;

export const FOOD_VISUAL_KEYS = [
  'candy',
  'bread',
  'meal',
  'leafy-vegetable',
  'onion',
  'broccoli',
  'carrot',
  'squash',
  'pumpkin',
  'zucchini',
  'eggplant',
  'cabbage',
  'cauliflower',
  'root-vegetable',
  'cucumber',
  'sprouts',
  'celery',
  'tomato',
  'mushroom',
  'pepper',
  'radish',
  'beans',
  'fennel',
  'corn',
  'bowl',
  'butter',
  'oil',
  'olives',
  'avocado',
  'peanut',
  'nuts',
  'coconut',
  'watermelon',
  'pear',
  'pineapple',
  'orange-fruit',
  'peach',
  'citrus',
  'banana',
  'cherries',
  'melon',
  'mango',
  'grapes',
  'tropical-fruit',
  'papaya',
  'kiwi',
  'pomegranate',
  'plum',
  'fig',
  'apple',
  'strawberry',
  'berries',
  'dried-fruit',
  'sweet-potato',
  'potato',
  'beet',
  'rice',
  'peas',
  'oats',
  'grain',
  'pasta',
  'soda',
  'wine',
  'beer',
  'honey',
  'eggs',
  'fish',
  'chicken',
  'meat',
  'dairy',
  'tofu',
] as const;
export const FoodVisualKeySchema = z.enum(FOOD_VISUAL_KEYS);
export type FoodVisualKey = z.infer<typeof FoodVisualKeySchema>;

export const FoodItemSchema = z
  .object({
    id: UuidSchema,
    ordinal: z.number().int().nonnegative(),
    visualKey: FoodVisualKeySchema,
    name: BilingualTextSchema,
    portion: BilingualTextSchema.nullable(),
    notes: BilingualTextSchema.nullable(),
  })
  .strict();
export type FoodItem = z.infer<typeof FoodItemSchema>;

export const FoodListSchema = z
  .object({
    id: UuidSchema,
    slug: z.string().min(1),
    name: BilingualTextSchema,
    description: BilingualTextSchema.nullable(),
    weekNumber: ProgramWeekNumberSchema.nullable(),
    items: z.array(FoodItemSchema),
  })
  .strict();
export type FoodList = z.infer<typeof FoodListSchema>;

export const FoodListsResponseSchema = z
  .object({
    scheduledWeekNumber: ProgramWeekNumberSchema,
    contentWeekNumber: ProgramWeekNumberSchema,
    lists: z.array(FoodListSchema),
  })
  .strict();
export type FoodListsResponse = z.infer<typeof FoodListsResponseSchema>;

export const ProgramListsQuerySchema = z
  .object({
    weekNumber: z.coerce.number().int().min(1).max(13).optional(),
  })
  .strict();
export type ProgramListsQuery = z.infer<typeof ProgramListsQuerySchema>;
