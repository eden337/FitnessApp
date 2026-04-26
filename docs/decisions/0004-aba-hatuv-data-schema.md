# ADR 0004 — Aba Hatuv data schema

**Status:** **superseded by ADR 0007** · **Date:** 2026-04-24

> ⚠️ The exchange-table model below was never implemented in any migration.
> Once the Hebrew PDFs were transcribed it became clear Aba Hatuv is a
> 13-week behavioral program, not a portion-exchange diet. See
> [ADR 0007](0007-program-not-tier.md) for the replacement schema actually
> used in `apps/server/src/db/migrations/0003_program.sql`.

## Context

The Aba Hatuv program is a portion-exchange-style diet: foods are grouped
into categories (protein, carb, vegetable, fat, fruit, dairy, "free"), each
with a standard portion size; a daily plan specifies how many portions from
each category a user eats per meal, scaled by gender and a calorie tier.

We need the data to be:
- queryable from the backend (so plans can be generated server-side),
- bilingual (HE + EN),
- versioned (so historical logs reference the program revision that was
  active when they were logged),
- easy to review and update by a human (a spreadsheet-style reviewer should
  be able to audit it).

## Decision

Three tables + versioned JSON seeds:

- `food_categories` — stable vocabulary, keyed by a machine key (`protein`)
  with localized display names.
- `food_items` — each food with category, portion size, and macro data.
- `meal_templates` — one row per `(program_version, gender, calorie_tier,
  meal_type)` containing a JSON list of `{ category_key, count }`.

Seeds live under `apps/server/src/db/seeds/aba-hatuv/<program_version>/`:
- `categories.json`
- `items.json`
- `templates.json`

A small loader reads, zod-validates, and upserts them idempotently.

## Consequences

- **Pros:** auditable JSON diff; immutable history (log rows reference the
  `program_version` they were generated from); plan generation is pure math
  on top of indexed lookups.
- **Cons:** template format has to be expressive enough for edge cases
  (meal-specific substitutions, mid-program tier changes). We accept that v1
  is rigid and revisit if a real nutritionist needs richer authoring.

## Open items

- Transcribing the Hebrew PDFs fully: the current environment lacks
  `pdftoppm`/`pdftotext`. Phase 3 starts with either installing
  poppler-utils or requesting the missing pages as images/text.
