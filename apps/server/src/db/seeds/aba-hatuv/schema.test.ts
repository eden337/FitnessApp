import {
  FoodItemSeedSchema,
  FoodListSeedSchema,
  ProgramSeedSchema,
  ProgramTaskSeedSchema,
  ProgramWeekSeedSchema,
  SeedBundleSchema,
} from './schema.js';

const validBilingual = { he: 'עברית', en: 'English' };

describe('seed schemas', () => {
  describe('ProgramSeedSchema', () => {
    it('parses a minimal program', () => {
      expect(ProgramSeedSchema.parse({ version: 'v1', name: validBilingual })).toEqual({
        version: 'v1',
        name: validBilingual,
      });
    });

    it('rejects missing version', () => {
      expect(() => ProgramSeedSchema.parse({ name: validBilingual })).toThrow();
    });

    it('rejects empty bilingual strings', () => {
      expect(() =>
        ProgramSeedSchema.parse({ version: 'v1', name: { he: '', en: 'x' } }),
      ).toThrow();
    });
  });

  describe('ProgramWeekSeedSchema', () => {
    const baseWeek = {
      weekNumber: 1,
      slug: 'leptin-flooding-1',
      title: validBilingual,
      mission: validBilingual,
    };

    it('parses a week with no tasks (defaults to empty array)', () => {
      const parsed = ProgramWeekSeedSchema.parse(baseWeek);
      expect(parsed.tasks).toEqual([]);
    });

    it('accepts null rationale and notes', () => {
      expect(
        ProgramWeekSeedSchema.parse({ ...baseWeek, rationale: null, notes: null }),
      ).toEqual(expect.objectContaining({ rationale: null, notes: null }));
    });

    it('accepts a partial bilingual notes block (he-only)', () => {
      const parsed = ProgramWeekSeedSchema.parse({
        ...baseWeek,
        notes: { he: 'בעברית בלבד' },
      });
      expect(parsed.notes).toEqual({ he: 'בעברית בלבד', en: null });
    });

    it('rejects week numbers outside 1..52', () => {
      expect(() => ProgramWeekSeedSchema.parse({ ...baseWeek, weekNumber: 0 })).toThrow();
      expect(() => ProgramWeekSeedSchema.parse({ ...baseWeek, weekNumber: 53 })).toThrow();
    });

    it('rejects non-kebab-case slugs', () => {
      expect(() => ProgramWeekSeedSchema.parse({ ...baseWeek, slug: 'CamelCase' })).toThrow();
      expect(() => ProgramWeekSeedSchema.parse({ ...baseWeek, slug: 'with spaces' })).toThrow();
      expect(() => ProgramWeekSeedSchema.parse({ ...baseWeek, slug: '1-cant-start-with-digit' })).toThrow();
    });

    it('rejects unknown extra fields (strict)', () => {
      expect(() =>
        ProgramWeekSeedSchema.parse({ ...baseWeek, evil: 'extra' } as unknown),
      ).toThrow();
    });
  });

  describe('ProgramTaskSeedSchema', () => {
    it('parses a required task with no description', () => {
      expect(
        ProgramTaskSeedSchema.parse({ kind: 'required', title: validBilingual }),
      ).toEqual({ kind: 'required', title: validBilingual });
    });

    it('rejects an unknown kind', () => {
      expect(() =>
        ProgramTaskSeedSchema.parse({ kind: 'maybe', title: validBilingual }),
      ).toThrow();
    });
  });

  describe('FoodListSeedSchema', () => {
    it('parses a global list with items', () => {
      const parsed = FoodListSeedSchema.parse({
        slug: 'proteins',
        name: validBilingual,
        items: [{ name: { he: 'ביצים', en: 'Eggs' }, visualKey: 'eggs' }],
      });
      expect(parsed.weekSlug).toBeNull();
      expect(parsed.items.length).toBe(1);
    });

    it('parses a week-scoped list', () => {
      const parsed = FoodListSeedSchema.parse({
        slug: 'cleanse-vacation',
        name: validBilingual,
        weekSlug: 'leptin-cleanse',
        items: [],
      });
      expect(parsed.weekSlug).toBe('leptin-cleanse');
    });

    it('rejects unknown extra fields', () => {
      expect(() =>
        FoodListSeedSchema.parse({
          slug: 'x',
          name: validBilingual,
          extraJunk: 1,
        } as unknown),
      ).toThrow();
    });
  });

  describe('FoodItemSeedSchema', () => {
    it('accepts portion + notes', () => {
      const parsed = FoodItemSeedSchema.parse({
        name: validBilingual,
        visualKey: 'bowl',
        portion: { he: 'כפית', en: 'tsp' },
        notes: { he: 'הערה', en: 'note' },
      });
      expect(parsed.portion).toEqual({ he: 'כפית', en: 'tsp' });
    });

    it('requires a supported visual key', () => {
      expect(() =>
        FoodItemSeedSchema.parse({ name: validBilingual, visualKey: 'unknown-food-art' }),
      ).toThrow();
      expect(() => FoodItemSeedSchema.parse({ name: validBilingual })).toThrow();
    });
  });

  describe('SeedBundleSchema (cross-file invariants)', () => {
    const bundle = {
      program: { version: 'v1', name: validBilingual },
      weeks: [
        { weekNumber: 1, slug: 'a', title: validBilingual, mission: validBilingual },
        { weekNumber: 2, slug: 'b', title: validBilingual, mission: validBilingual },
      ],
      lists: [{ slug: 'proteins', name: validBilingual, weekSlug: null, items: [] }],
    };

    it('parses a valid bundle', () => {
      expect(() => SeedBundleSchema.parse(bundle)).not.toThrow();
    });

    it('rejects duplicate week numbers', () => {
      expect(() =>
        SeedBundleSchema.parse({
          ...bundle,
          weeks: [
            { weekNumber: 1, slug: 'a', title: validBilingual, mission: validBilingual },
            { weekNumber: 1, slug: 'b', title: validBilingual, mission: validBilingual },
          ],
        }),
      ).toThrow(/duplicate week 1/);
    });

    it('rejects a week-scoped list whose weekSlug does not match any week', () => {
      expect(() =>
        SeedBundleSchema.parse({
          ...bundle,
          lists: [
            { slug: 'orphan', name: validBilingual, weekSlug: 'no-such-week', items: [] },
          ],
        }),
      ).toThrow(/unknown week/);
    });
  });
});
