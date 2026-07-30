# Feature — Profile

**Status:** Server APIs, store, setup flow, and private Profile summary
implemented. Editing remains pending.

## Goal

Capture the private personalization inputs that drive the plan: gender, birth
date, height, initial/current weight, activity level, goal, optional goal
weight, dietary restrictions, and locale.

## Data model

- `users`: identity and display fields.
- `user_metrics`: private current weight, activity level, goal data, dietary
  restrictions, and the foundation start date.

## REST surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/users/me/profile` | Return `{ profile, metrics, derived }` |
| PATCH | `/api/v1/users/me/profile` | Patch identity-side fields |
| PATCH | `/api/v1/users/me/metrics` | Patch initialized metrics |
| PUT | `/api/v1/users/me/metrics` | Complete initial setup |

## Derived metrics

The server computes:

- `ageYears` from birth date.
- `bmi` from weight and height, rounded to one decimal.
- `bmrKcal` with Mifflin–St Jeor.
- `tdeeKcal` from BMR and activity.
- `targetKcal` from TDEE and goal.

The mobile client reads these values and does not recompute them.

## Mobile information architecture

- `ProfileSetupScreen` captures the initial inputs.
- `ProfileScreen` privately shows current weight, BMI, and age.
- Home never displays private body data, BMR, TDEE, or calorie targets.
- Language, appearance, and sign-out live in `SettingsScreen`.

## Validation and scope

All inputs use shared Zod schemas. Every route is authenticated and implicitly
scoped to the caller's verified user ID. No profile or metric is couple-visible
by default.
