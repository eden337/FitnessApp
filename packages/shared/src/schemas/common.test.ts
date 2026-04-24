import { ActivityLevelSchema, GenderSchema, GoalTypeSchema, LocaleSchema } from './common.js';

describe('common enums', () => {
  it('accepts only known locales', () => {
    expect(LocaleSchema.parse('he')).toBe('he');
    expect(LocaleSchema.parse('en')).toBe('en');
    expect(() => LocaleSchema.parse('fr')).toThrow();
  });

  it('accepts only known genders', () => {
    for (const g of ['female', 'male', 'other'] as const) {
      expect(GenderSchema.parse(g)).toBe(g);
    }
    expect(() => GenderSchema.parse('unknown')).toThrow();
  });

  it('accepts only known activity levels', () => {
    for (const a of ['sedentary', 'light', 'moderate', 'high', 'athlete'] as const) {
      expect(ActivityLevelSchema.parse(a)).toBe(a);
    }
    expect(() => ActivityLevelSchema.parse('couch')).toThrow();
  });

  it('accepts only known goal types', () => {
    for (const g of ['lose', 'maintain', 'gain'] as const) {
      expect(GoalTypeSchema.parse(g)).toBe(g);
    }
    expect(() => GoalTypeSchema.parse('shred')).toThrow();
  });
});
