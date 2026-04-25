import type { Gender } from '../db/types.js';

export type BmrInput = {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
};

/**
 * Mifflin-St Jeor BMR (kcal/day).
 *
 * - female: 10w + 6.25h - 5a - 161
 * - male  : 10w + 6.25h - 5a + 5
 * - other : average of the two so the engine never produces an outlier.
 *
 * Refs: Mifflin et al., 1990. Inputs are validated by zod elsewhere; this
 * function trusts its arguments and returns a non-negative number rounded
 * to one decimal place to keep downstream math stable.
 */
export const bmrKcal = ({ gender, weightKg, heightCm, ageYears }: BmrInput): number => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const genderOffset = gender === 'male' ? 5 : gender === 'female' ? -161 : (5 + -161) / 2;
  return Math.round((base + genderOffset) * 10) / 10;
};

export const ageFromBirthDate = (birthDate: Date, today: Date = new Date()): number => {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const before =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());
  if (before) age -= 1;
  return age;
};
