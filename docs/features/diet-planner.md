# Feature — Diet planner (Aba Hatuv)

**Status:** Phase 3 (not yet implemented; blocked on full PDF transcription).

## Goal

Generate a personalized daily meal plan based on the Aba Hatuv program, let
the user swap foods within category constraints, and log what they actually
ate (so we can show adherence and partner-visible progress).

## Engine

- Input: user's `gender`, `age`, `heightCm`, `currentWeightKg`, `activityLevel`,
  `goalType`.
- Steps:
  1. `bmrKcal = mifflinStJeor(gender, weight, height, age)`.
  2. `targetKcal = bmrKcal * activityFactor + goalDelta`.
  3. `tier = closestTier(targetKcal, AbaHatuvTiers)`.
  4. `plan = meal_templates WHERE program_version = $v AND gender = $g
             AND calorie_tier = $tier` → list of meals, each with required
     category-count portions.
  5. For each meal we present the user a curated **picker** of items in each
     required category; they confirm.

## Surface

- REST: `GET /diet/catalog`, `GET /diet/plan`, `POST /diet/meal-log`,
  `POST /diet/water-log`.
- Mobile: `TodayPlanScreen`, `MealLogScreen`, `WaterTrackerWidget`.
- MobX: `DietStore` (observable `todayPlan`, `catalog`, `todaysMeals`,
  `waterMl`).

## Localization

- Every food + category has `name_he` + `name_en`; the active locale selects.
- Portion descriptions are free-text per locale (common units differ; e.g.
  "כוס" vs. "cup").

## Tests

- Engine unit tests: BMR / TDEE / tier selection against hand-computed cases.
- Catalog: API returns localized names per `?lang=`.
- Logging: POST persists; event fires on couple room; totals recomputed.
