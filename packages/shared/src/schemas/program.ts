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
  'sugars',
  'flours-and-ground-foods',
  'other-foods-on-vacation',
  'artichoke',
  'asparagus',
  'onion',
  'broccoli',
  'okra',
  'carrot',
  'butternut-squash',
  'pumpkin',
  'zucchini',
  'lettuce',
  'eggplant',
  'cilantro',
  'white-or-red-cabbage',
  'cauliflower',
  'leek',
  'turnip',
  'hearts-of-palm',
  'cucumber',
  'chard',
  'sprouts',
  'celery',
  'tomato',
  'cherry-tomatoes',
  'parsley',
  'mushrooms',
  'bell-pepper',
  'radish',
  'kohlrabi',
  'summer-squash',
  'kale',
  'green-or-yellow-beans',
  'fennel',
  'spinach',
  'baby-corn',
  'tahini',
  'butter',
  'cooking-oil',
  'olives',
  'avocado',
  'peanut-butter',
  'almond-butter',
  'nuts-almonds',
  'coconut-products',
  'watermelon',
  'pear',
  'cherimoya',
  'fresh-pineapple',
  'persimmon',
  'peach',
  'grapefruit',
  'banana',
  'guava',
  'cherries',
  'quince',
  'fresh-lychee',
  'melon',
  'mango',
  'apricot',
  'nectarine',
  'prickly-pear',
  'grapes',
  'passion-fruit',
  'papaya',
  'kiwi',
  'clementine',
  'star-fruit',
  'pomegranate',
  'plum',
  'loquat',
  'fresh-fig',
  'orange',
  'apple',
  'strawberry',
  'berries',
  'dried-fruit',
  'sweet-potato',
  'potatoes',
  'beetroot',
  'rice',
  'beans',
  'lentils',
  'peas',
  'chickpeas',
  'fresh-fruit',
  'thick-rolled-oats',
  'quinoa',
  'buckwheat',
  'corn',
  'edamame',
  'pearl-barley',
  'skinny-pasta',
  'diet-cola',
  'dry-wine',
  'beer',
  'honey',
  'eggs',
  'fish',
  'chicken',
  'meat',
  'dairy-products',
  'tofu',
  'seitan',
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
