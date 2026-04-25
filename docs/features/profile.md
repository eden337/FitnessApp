# Feature — Profile

**Status:** Phase 1 (not yet implemented).

## Goal

Capture the personalization inputs that drive the diet engine: gender,
birth date (→ age), height, current weight, activity level, goal (lose /
maintain / gain) and optional goal weight, dietary restrictions, locale.

## Surface

- REST: `GET /users/me/profile`, `PATCH /users/me/profile`, `PATCH /users/me/metrics`.
- Mobile screens: `ProfileSetupScreen` (first run), `ProfileEditScreen`.
- MobX: `ProfileStore` (observable `profile`, `metrics`; action `save(patch)`).
- Derived values (computed on server and surfaced read-only): `age`,
  `bmrKcal`, `targetKcal`, `abaHatuvTier`.

## Validation

- `heightCm`: 50–250.
- `currentWeightKg`: 20–300.
- `birthDate`: derives age 10–120.
- `activityLevel`: enum.
- `dietaryRestrictions`: bounded JSON (known keys only).

## Tests

- Pure-function tests for `bmr.ts`, `calorie-target.ts`, `aba-hatuv-tier.ts`
  against canonical cases (Mifflin-St Jeor worked examples).
- REST: profile round-trip; metrics update triggers recomputed derived values.
- Mobile: form validation messages in both locales; save flow happy/error
  paths.
