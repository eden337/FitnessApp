import { z } from 'zod';
import { FoodVisualKeySchema } from '@fitnessapp/shared';

/**
 * Bilingual string with at least one Hebrew form. English is required so the
 * fallback locale always has content; if you don't have a translation yet,
 * use the same value as Hebrew and flag it with `// TODO_EN` in the JSON.
 */
const Bilingual = z
  .object({
    he: z.string().min(1),
    en: z.string().min(1),
  })
  .strict();

const OptionalBilingual = z
  .object({
    he: z.string().min(1).nullable().optional(),
    en: z.string().min(1).nullable().optional(),
  })
  .strict()
  .transform((v) => ({ he: v.he ?? null, en: v.en ?? null }))
  .nullable();

/** Slugs are kebab-case ASCII, used as machine-stable identifiers. */
const Slug = z.string().regex(/^[a-z][a-z0-9-]*$/, 'slug must be kebab-case');

const TaskKind = z.enum(['required', 'optional']);

export const ProgramTaskSeedSchema = z
  .object({
    kind: TaskKind,
    title: Bilingual,
    description: OptionalBilingual.optional(),
  })
  .strict();
export type ProgramTaskSeed = z.infer<typeof ProgramTaskSeedSchema>;

export const ProgramWeekSeedSchema = z
  .object({
    weekNumber: z.number().int().min(1).max(52),
    slug: Slug,
    title: Bilingual,
    mission: Bilingual,
    rationale: OptionalBilingual.optional(),
    notes: OptionalBilingual.optional(),
    tasks: z.array(ProgramTaskSeedSchema).default([]),
  })
  .strict();
export type ProgramWeekSeed = z.infer<typeof ProgramWeekSeedSchema>;

export const FoodItemSeedSchema = z
  .object({
    name: Bilingual,
    visualKey: FoodVisualKeySchema,
    portion: OptionalBilingual.optional(),
    notes: OptionalBilingual.optional(),
  })
  .strict();
export type FoodItemSeed = z.infer<typeof FoodItemSeedSchema>;

export const FoodListSeedSchema = z
  .object({
    slug: Slug,
    name: Bilingual,
    description: OptionalBilingual.optional(),
    /** When set, the list is scoped to that week's PDF (e.g. week-3 cleanse). */
    weekSlug: Slug.nullable().default(null),
    items: z.array(FoodItemSeedSchema).default([]),
  })
  .strict();
export type FoodListSeed = z.infer<typeof FoodListSeedSchema>;

export const ProgramSeedSchema = z
  .object({
    version: z.string().min(1),
    name: Bilingual,
    description: OptionalBilingual.optional(),
  })
  .strict();
export type ProgramSeed = z.infer<typeof ProgramSeedSchema>;

/**
 * The full seed bundle: one program + its weeks + its lists. The loader
 * builds this in memory from the on-disk JSON files before the upsert.
 */
export const SeedBundleSchema = z
  .object({
    program: ProgramSeedSchema,
    weeks: z.array(ProgramWeekSeedSchema),
    lists: z.array(FoodListSeedSchema),
  })
  .strict()
  .superRefine((bundle, ctx) => {
    const seen = new Set<number>();
    for (const w of bundle.weeks) {
      if (seen.has(w.weekNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate week ${w.weekNumber}`,
          path: ['weeks'],
        });
      }
      seen.add(w.weekNumber);
    }
    const weekSlugs = new Set(bundle.weeks.map((w) => w.slug));
    for (const list of bundle.lists) {
      if (list.weekSlug !== null && !weekSlugs.has(list.weekSlug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `food list "${list.slug}" references unknown week "${list.weekSlug}"`,
          path: ['lists'],
        });
      }
    }
  });
export type SeedBundle = z.infer<typeof SeedBundleSchema>;
