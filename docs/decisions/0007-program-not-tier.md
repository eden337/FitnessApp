# ADR 0007 — Aba Hatuv is a 13-week program, not a calorie-tier diet

**Status:** accepted · supersedes ADR 0004 · **Date:** 2026-04-25

## Context

ADR 0004 modelled the Aba Hatuv data as a portion-exchange diet: food
categories with portion sizes, meal templates per gender × calorie tier,
plan generation off BMR/TDEE. That model assumed a typical Israeli weight-
loss diet shape.

Once `poppler-utils` was installed and the 12 PDFs were transcribed, it
became clear the program is **not** a calorie-exchange diet. It's a
**13-week behavioral protocol** ("הצפה / ניקוי / טרנספורמציה / מסלולים /
העמקה לפטינית") with weekly missions, physiological rationale, and
reference food lists rather than meal templates. Examples:

- Week 1: drink 2-4 L water/day; two cups before every eating event;
  *don't change anything else*.
- Week 3: 50 % cleansing vegetables in the two largest meals; planned
  "vacation" from sugars, flours, and ground foods.
- Week 9: pick a personalised continuation track — fast / cleanse / moderate.

There is no per-tier calorie ladder; food categories show up only as
**reference lists** (proteins, fats, leptin carbs, fruits, limited,
vacation), not portion-counted exchanges.

## Decision

Replace the food_categories / food_items / meal_templates schema with a
program-centric one:

- `program_weeks(id, program_version, week_number, slug, title_*, mission_*, rationale_*, notes_*)`.
- `program_tasks(id, week_id, ordinal, kind, title_*, description_*)` —
  granular checkable items per week.
- `food_lists(id, program_version, slug, name_*, description_*, week_id NULL)` —
  named reference groups; `week_id NULL` ⇒ global, otherwise scoped to one
  week's PDF (e.g. the week-3 cleanse "vacation" list).
- `food_items(id, list_id, ordinal, name_*, portion_*, notes_*)` — items
  inside a list. `portion_*` is free-text ("1-2 teaspoons / day") because
  portions in this program are loose guidance, not exchange units.

Seeds live under `apps/server/src/db/seeds/aba-hatuv/<version>/`:

```
v1/
  program.json
  weeks/01.json … 13.json   (1..10, 12, 13 — week 11 PDF was not provided)
  food-lists/*.json         (proteins, fats, leptin-carbs, …, cleanse-vacation)
```

Each file is validated by zod at load time; the loader (`src/db/seedLoader.ts`)
upserts in a single transaction and is fully idempotent.

The shared `packages/shared` package gains the runtime DTO types when the
mobile screens land in a follow-up; this ADR is only about the data shape.

## Consequences

- **Pros**: matches the actual program; trivial to extend with new weeks /
  lists; bilingual prose is on every row from day one; per-week files stay
  small enough to review in a PR.
- **Cons**: no automatic plan generation off BMR — the engine is informed
  by the user's current week, not their calorie target. The BMR/TDEE
  numbers we already compute become advisory metadata for the home screen
  rather than a meal-plan input.
- **Migration cost**: the calorie-tier schema was never created in any
  migration (only described in earlier docs / ADRs), so no data migration
  is needed.

## Implementation update (2026-07-29)

- The supplied companion PDFs filled the bilingual rationale, notes, tasks,
  cleansing-vegetables list, and fruit guidance for the Phase 3b release.
- The authoritative cleansing-vegetables source contains 34 entries.
- Week 11 remains unavailable. The runtime schedules week 11 normally while
  displaying week 10 content with an explicit fallback marker.
- Shared runtime DTOs, authenticated program APIs, and the bilingual mobile
  Today and food-list screens now implement this decision.

## Historical open items

- Week 11 PDF is missing from the upload — the seed bundle skips it for now
  with a clear gap. Drop the PDF in and add `weeks/11.json` whenever it's
  available.
- Hebrew transcription was done from the extracted PDF text; long
  paragraphs (rationale / notes) are filled in for week 1 and week 3 and
  left as `null` placeholders elsewhere — to be reviewed and translated to
  English before any user-facing release.
- Cleansing-vegetables and fruits lists are intentionally empty — the PDFs
  reference an external list ("לחצו כאן לרשימה ירקות המלאה"). Filled in
  once the linked list is provided.
