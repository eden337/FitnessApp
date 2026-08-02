import {
  DateOnlySchema,
  DerivedUserMetricsSchema,
  DietaryRestrictionsSchema,
  HeightCmSchema,
  ProfileSetupInputSchema,
  UpdateMetricsInputSchema,
  UpdateProfileInputSchema,
  UserMetricsSchema,
  UserProfileSchema,
  WeightKgSchema,
} from './user.js';

describe('DateOnlySchema', () => {
  it('accepts ISO YYYY-MM-DD strings', () => {
    expect(DateOnlySchema.parse('1990-04-15')).toBe('1990-04-15');
  });

  it('rejects other formats', () => {
    expect(() => DateOnlySchema.parse('15/04/1990')).toThrow();
    expect(() => DateOnlySchema.parse('1990-4-1')).toThrow();
  });
});

describe('Height/weight ranges', () => {
  it.each([49, 251, 0, -1])('rejects out-of-range height %d', (v) => {
    expect(() => HeightCmSchema.parse(v)).toThrow();
  });
  it.each([19, 301, 0, -5])('rejects out-of-range weight %d', (v) => {
    expect(() => WeightKgSchema.parse(v)).toThrow();
  });
  it('accepts realistic adult values', () => {
    expect(HeightCmSchema.parse(170)).toBe(170);
    expect(WeightKgSchema.parse(72.5)).toBe(72.5);
  });
});

describe('DietaryRestrictionsSchema', () => {
  it('accepts an empty object', () => {
    expect(DietaryRestrictionsSchema.parse({})).toEqual({});
  });
  it('accepts known keys and an allergies list', () => {
    const v = { kosher: true, vegetarian: false, allergies: ['peanut', 'sesame'] };
    expect(DietaryRestrictionsSchema.parse(v)).toEqual(v);
  });
  it('rejects unknown keys', () => {
    expect(() =>
      DietaryRestrictionsSchema.parse({ paleo: true } as unknown),
    ).toThrow();
  });
  it('caps the allergies list size', () => {
    expect(() =>
      DietaryRestrictionsSchema.parse({ allergies: Array(21).fill('x') }),
    ).toThrow();
  });
});

describe('UserProfileSchema + UserMetricsSchema', () => {
  const profile = {
    id: '00000000-0000-4000-8000-000000000000',
    email: 'someone@example.com',
    displayName: 'Jane',
    locale: 'he' as const,
    gender: 'female' as const,
    birthDate: '1990-04-15',
    heightCm: 165,
  };

  it('round-trips a valid profile', () => {
    expect(UserProfileSchema.parse(profile)).toEqual(profile);
  });

  it('rejects an unknown extra field on the profile', () => {
    expect(() => UserProfileSchema.parse({ ...profile, admin: true } as unknown)).toThrow();
  });

  it('round-trips valid metrics', () => {
    const metrics = {
      currentWeightKg: 65,
      activityLevel: 'moderate' as const,
      goalType: 'lose' as const,
      goalWeightKg: 60,
      dietaryRestrictions: { kosher: true },
    };
    expect(UserMetricsSchema.parse(metrics)).toEqual(metrics);
  });
});

describe('DerivedUserMetricsSchema', () => {
  it('includes BMI for the private profile summary', () => {
    expect(
      DerivedUserMetricsSchema.parse({
        ageYears: 35,
        bmi: 23.9,
        bmrKcal: 1370.3,
        tdeeKcal: 2124,
        targetKcal: 1624,
      }).bmi,
    ).toBe(23.9);
  });
});

describe('Update inputs are partial', () => {
  it('accepts an empty patch on profile updates', () => {
    expect(UpdateProfileInputSchema.parse({})).toEqual({});
  });
  it('accepts an empty patch on metrics updates', () => {
    expect(UpdateMetricsInputSchema.parse({})).toEqual({});
  });
});

describe('ProfileSetupInputSchema', () => {
  it('defaults goalWeightKg and dietaryRestrictions when omitted', () => {
    const parsed = ProfileSetupInputSchema.parse({
      gender: 'male',
      birthDate: '1990-01-01',
      heightCm: 180,
      currentWeightKg: 80,
      activityLevel: 'moderate',
      goalType: 'maintain',
    });
    expect(parsed.goalWeightKg).toBeNull();
    expect(parsed.dietaryRestrictions).toEqual({});
  });
});
