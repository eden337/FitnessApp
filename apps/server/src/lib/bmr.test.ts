import { ageFromBirthDate, bmrKcal, bodyMassIndex } from './bmr.js';

describe('bmrKcal (Mifflin-St Jeor)', () => {
  it('matches the canonical male example', () => {
    // Mifflin: 10*80 + 6.25*178 - 5*30 + 5 = 1767.5
    expect(bmrKcal({ gender: 'male', weightKg: 80, heightCm: 178, ageYears: 30 })).toBe(1767.5);
  });

  it('matches the canonical female example', () => {
    // 65kg, 165cm, 30y, female => 1370.25 -> 1370.3 after one-decimal rounding
    expect(bmrKcal({ gender: 'female', weightKg: 65, heightCm: 165, ageYears: 30 })).toBe(1370.3);
  });

  it('uses the average offset for "other"', () => {
    const male = bmrKcal({ gender: 'male', weightKg: 70, heightCm: 170, ageYears: 30 });
    const female = bmrKcal({ gender: 'female', weightKg: 70, heightCm: 170, ageYears: 30 });
    const other = bmrKcal({ gender: 'other', weightKg: 70, heightCm: 170, ageYears: 30 });
    expect(other).toBeCloseTo((male + female) / 2, 0);
  });

  it('decreases with age', () => {
    const young = bmrKcal({ gender: 'male', weightKg: 80, heightCm: 178, ageYears: 25 });
    const old = bmrKcal({ gender: 'male', weightKg: 80, heightCm: 178, ageYears: 65 });
    expect(young).toBeGreaterThan(old);
  });
});

describe('bodyMassIndex', () => {
  it('returns a one-decimal BMI from metric measurements', () => {
    expect(bodyMassIndex(65, 165)).toBe(23.9);
  });
});

describe('ageFromBirthDate', () => {
  it('counts a full year only after the birthday has passed', () => {
    const today = new Date(Date.UTC(2026, 4, 1)); // 2026-05-01
    expect(ageFromBirthDate(new Date(Date.UTC(1990, 0, 1)), today)).toBe(36);
    // birthday tomorrow -> not yet 36
    expect(ageFromBirthDate(new Date(Date.UTC(1990, 4, 2)), today)).toBe(35);
    // birthday today -> exactly 36
    expect(ageFromBirthDate(new Date(Date.UTC(1990, 4, 1)), today)).toBe(36);
  });

  it('handles future birth dates by returning a negative age (caller should validate)', () => {
    const today = new Date(Date.UTC(2020, 0, 1));
    expect(ageFromBirthDate(new Date(Date.UTC(2030, 0, 1)), today)).toBeLessThan(0);
  });
});
