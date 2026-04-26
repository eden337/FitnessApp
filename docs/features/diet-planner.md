# Feature — Aba Hatuv program

**Status:** Phase 3a — schema + seeds scaffolded. Engine, REST surface, and
mobile screens land in Phase 3b.

> Renamed from "Diet planner" — the program isn't a calorie-exchange diet.
> See [ADR 0007](../decisions/0007-program-not-tier.md).

## Goal

Walk the user (and their partner) through the 13-week Aba Hatuv behavioral
protocol: surface the current week's mission and tasks, show the reference
food lists (proteins, leptin carbs, fats, fruits, limited, weekly
"vacation"), and let the user mark required tasks done day-to-day.

## Data shape (Phase 3a — landed)

Migration `0003_program.sql` creates:

- **`program_weeks`** — one row per week (1..13), with `mission_*`,
  `rationale_*`, `notes_*` in HE/EN.
- **`program_tasks`** — checkable items per week, ordinal-ordered;
  `kind ∈ {required, optional}`.
- **`food_lists`** — named groups, either global or week-scoped via
  `week_id`. Partial unique indexes keep "global" and "week-scoped"
  uniqueness independent.
- **`food_items`** — items inside a list, with optional `portion_*` and
  `notes_*` (free-text — portions in this program are guidance, not units).

Seeds live under `apps/server/src/db/seeds/aba-hatuv/v1/`:

```
program.json
weeks/01.json … 13.json   (week 11 PDF was not provided — skipped)
food-lists/{proteins,leptin-carbs,fats,cleansing-vegetables,
            fruits,limited,cleanse-vacation}.json
```

A small zod-validated loader (`src/db/seedLoader.ts`) reads every file,
checks structural invariants (no duplicate week numbers, every
`weekSlug` reference resolves), and upserts in a single transaction.

Run via `pnpm --filter @fitnessapp/server seed`.

## Engine (Phase 3b — pending)

- Input: user's birth date → current week (relative to user's program
  start date — TBD, plumbed via `user_metrics.program_started_on`).
- Output:
  - Today's mission text + checklist of tasks.
  - Reference food lists for the current week (global lists +
    any week-scoped list whose `week_id` matches the current week).
- BMR / TDEE / target stays in `user_metrics.derived` as advisory metadata
  on the home screen — it doesn't drive plan generation.

## Mobile (Phase 3b — pending)

- `screens/program/TodayScreen.tsx` — current week + mission + tasks.
- `screens/program/FoodListsScreen.tsx` — browseable reference lists.
- `screens/program/TaskCheckScreen.tsx` — daily required-task checklist.
- `stores/ProgramStore.ts` — observable `currentWeek`, `tasks`, `lists`.

## Bilingual

Every column has `_he` / `_en` siblings. The mobile client selects on the
active locale; English is required at seed-time so the fallback locale
always has content (with a `// TODO_EN` flag in the JSON when a paragraph
is left as the Hebrew original pending review).

## Tests

- **Schema** (Phase 3a): `seedLoader.test.ts` validates good seeds parse,
  bad seeds reject, the loader is idempotent (re-running the same bundle
  is a no-op), and re-seeding new content updates rows in place.
- **Engine + REST + mobile** tests land in Phase 3b alongside the actual
  feature surface.

## Open items

- **Week 11 PDF** is missing from the upload — the seed bundle skips it.
- **Cleansing-vegetables** and **fruits** lists are intentionally empty —
  the PDFs reference an external linked list. Drop the items in once the
  list is provided.
- **Long Hebrew paragraphs** (rationale, notes) are filled in for weeks
  1 + 3, left as `null` placeholders for the rest. They're transcribable
  from the extracted `pdftotext` output once reviewed.
- The user's program start date isn't yet captured on `user_metrics` —
  Phase 3b adds the column + onboarding step.
