# Feature — Profile

**Status:** Phase 1 — server APIs, store, setup flow, and home summary
implemented. A dedicated profile-edit screen remains pending.

## Goal

Capture the personalization inputs that drive the diet engine: gender,
birth date (→ age), height, current weight, activity level, goal (lose /
maintain / gain) and optional goal weight, dietary restrictions, locale.

## Data model

Two tables (see `docs/architecture/data-model.md`):

- `users` — identity + display fields (display_name, locale, gender,
  birth_date, height_cm).
- `user_metrics` — 1:1, mutable: current weight, activity level, goal
  type, goal weight, dietary restrictions JSON.

## REST surface

| Method | Path | Body | Purpose |
|---|---|---|---|
| GET | `/api/v1/users/me/profile` | — | `{ profile, metrics, derived }` |
| PATCH | `/api/v1/users/me/profile` | UpdateProfileInput | Patch identity-side fields |
| PATCH | `/api/v1/users/me/metrics` | UpdateMetricsInput | Patch one or more metrics fields |
| PUT | `/api/v1/users/me/metrics` | ProfileSetupInput \| UserMetrics | Initial setup; can also update profile fields |

## Derived metrics (server-computed)

When metrics exist, the response includes:

- `ageYears` — derived from `birthDate`.
- `bmrKcal` — Mifflin-St Jeor (`apps/server/src/lib/bmr.ts`).
- `tdeeKcal` — BMR × activity factor (`calorie-target.ts`).
- `targetKcal` — TDEE ± goal delta, floored at 1200 kcal for safety.

The mobile client never recomputes — it reads `derived` directly so a
single source of truth (the metrics row) flows through the system.

## Mobile flow

- `ProfileStore` (`apps/mobile/src/stores/ProfileStore.ts`): `fetch`,
  `setupMetrics`, `updateProfile`, `updateMetrics`, `reset`.
- `ProfileSetupScreen` collects current weight, activity level, goal,
  optional goal weight, then calls `setupMetrics`. After a successful
  PUT the navigator falls through to `HomeScreen`.
- `HomeScreen` shows a summary card with target / TDEE / BMR / weight /
  age, plus a sign-out button and the locale toggle.

## Validation

- `heightCm`: 50–250.
- `currentWeightKg` / `goalWeightKg`: 20–300.
- `birthDate`: ISO YYYY-MM-DD; age 10–120 enforced upstream by zod.
- `activityLevel`: `sedentary | light | moderate | high | athlete`.
- `goalType`: `lose | maintain | gain`.
- `dietaryRestrictions`: known keys only (kosher / vegetarian / vegan /
  glutenFree / allergies); unknown keys rejected.

## Auth scope

- Every route is gated by `requireAuth` (Bearer access token).
- `/users/me/*` is implicitly user-scoped: a user can only see/edit
  their own data; `userId` comes from the verified JWT, never the URL.

## Tests

- **Server:** `tests/users.test.ts` (Supertest); pure-helper tests for
  `bmr` and `calorie-target`.
- **Mobile:** `__tests__/ProfileStore.test.ts`,
  `__tests__/ProfileSetupScreen.test.tsx`, `__tests__/HomeScreen.test.tsx`.
