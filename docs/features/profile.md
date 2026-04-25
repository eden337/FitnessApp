# Feature — Profile

**Status:** Phase 1a — implemented (server-side). Mobile screens land in 1b.

## Goal

Capture the personalization inputs that drive the diet engine: gender,
birth date (→ age), height, current weight, activity level, goal (lose /
maintain / gain) and optional goal weight, dietary restrictions, locale.

## Data model

Two tables (see `docs/architecture/data-model.md`):

- `users` — immutable-ish identity + display fields (display_name, locale,
  gender, birth_date, height_cm).
- `user_metrics` — 1:1, mutable: current weight, activity level, goal type,
  goal weight, dietary restrictions JSON.

## Surface

| Method | Path | Body | Purpose |
|---|---|---|---|
| GET | `/api/v1/users/me/profile` | — | Returns `{ profile, metrics, derived }` |
| PATCH | `/api/v1/users/me/profile` | `UpdateProfileInputSchema` | Patch identity-side fields |
| PATCH | `/api/v1/users/me/metrics` | `UpdateMetricsInputSchema` | Patch one or more metrics fields |
| PUT | `/api/v1/users/me/metrics` | `ProfileSetupInputSchema` (or `UserMetricsSchema`) | Initial metrics setup; can also update profile fields in one call |

## Derived metrics (server-computed)

When metrics exist, the response includes:

- `ageYears` — derived from `birthDate`.
- `bmrKcal` — Mifflin-St Jeor (`src/lib/bmr.ts`).
- `tdeeKcal` — BMR × activity factor (`src/lib/calorie-target.ts`).
- `targetKcal` — TDEE ± goal delta, floored at 1200 kcal for safety.

These run on every read so a single source of truth (the metrics row)
flows through the system.

## Validation

- `heightCm`: 50–250.
- `currentWeightKg` / `goalWeightKg`: 20–300.
- `birthDate`: ISO YYYY-MM-DD, age 10–120 enforced upstream.
- `activityLevel`: `sedentary | light | moderate | high | athlete`.
- `goalType`: `lose | maintain | gain`.
- `dietaryRestrictions`: known keys only (kosher / vegetarian / vegan /
  glutenFree / allergies[<=20]); unknown keys rejected.

## Auth + couple scope

- Every route is gated by `requireAuth` (Bearer access token).
- `/users/me/*` is implicitly user-scoped: a user can only ever see/edit
  their own profile and metrics; the `userId` comes from the verified JWT,
  never from the URL.

## Tests

- `tests/users.test.ts` — full Supertest coverage of GET / PATCH / PUT,
  derived-metrics correctness, malformed-body rejection, and the
  metrics_not_initialized 409 branch.
- Pure helper tests for BMR / TDEE live in `src/lib/`.
