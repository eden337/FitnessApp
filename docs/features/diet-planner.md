# Feature — Aba Hatuv program

**Status:** Phase 3b — authored seeds, timeline engine, REST surface, and
mobile guidance implemented.

> The program is a 13-week behavioral protocol, not a calorie-exchange diet.
> See [ADR 0007](../decisions/0007-program-not-tier.md).

## Goal

Guide a new or existing participant through the program from their current
week. The app presents bilingual missions, rationale, notes, read-only tasks,
and global/week-scoped food references.

## Data and authored content

Migration `0003_program.sql` defines `program_weeks`, `program_tasks`,
`food_lists`, and `food_items`. Migration `0004_program_start.sql` adds the
nullable `user_metrics.program_started_on` timeline anchor. Migration
`0006_food_visuals.sql` adds each item's stable artwork key.

Versioned, Zod-validated seeds live under
`apps/server/src/db/seeds/aba-hatuv/v1/`. The supplied source guides have been
reviewed into HE/EN guidance and tasks for weeks 1-10 and 12-13. Week 11
remains absent because its source guide was not provided.

Core food references include proteins, fats, leptin carbohydrates, limited
items, the week-3 cleanse vacation, the complete 34-item cleansing-vegetable
sheet, and fruit portions/restrictions. The loader upserts all authored data
in one transaction and replaces ordered child entries idempotently.

## Timeline behavior

- Before start, `GET /api/v1/program/me/current` previews week 1.
- `POST /api/v1/program/me/start` accepts the participant's current week
  (1-13) once and derives a start date that gives that week seven full days.
- Israel calendar dates determine week boundaries.
- Scheduled week 11 repeats week-10 content with separate scheduled/content
  week numbers and `isFallback: true`; week 12 resumes on schedule.
- After 13 full weeks, week-13 content remains visible with completed status.
- `GET /api/v1/program/lists` returns global references plus the effective
  week's scoped references; `?weekNumber=` supports explicit browsing.

All routes require access-token authentication. Start is rate-limited and
requires an initialized `user_metrics` row.

## Mobile

`ProgramStore` owns current guidance, applicable lists, lifecycle, and errors.
The successful start response is authoritative and is committed immediately.
Food-list refresh has separate loading/error state: a secondary list failure
never rolls the program back to `not_started`, and the user can retry lists
without repeating the start request.
`TodayScreen` supports start/resume, localized weekly content, completion,
fallback disclosure, a mission-first hero, and numbered read-only task cards.
`FoodListsScreen` presents a colorful choice summary, per-list counts, and
filters global and
current-week lists. Every food carries a locale-independent `visualKey` that
maps to a stable food family and theme-invariant artwork. Custom outlined SVGs
are replacing the bundled Noto Emoji library incrementally; Noto remains the
offline fallback for every unfinished key and retains its Apache 2.0
attribution under `apps/mobile/assets/food/`. Artwork never receives a
light/dark tint—only its semantic family tile changes. The full contract lives
in [`docs/design/design.md`](../design/design.md). The state-driven navigator
opens both screens from Home without introducing React Navigation.

The initial custom vector set covers leafy vegetables, broccoli, carrot,
cucumber, eggplant, bell pepper, tomato, avocado, and fish. All remaining
visual keys continue to resolve through the full-color fallback map.

Every static string uses the `program` i18n namespace in Hebrew and English.
Program content remains bilingual in the DTO so locale switching does not
require refetching.

## Tests

- Seed integrity covers every supplied week, bilingual authored fields,
  tasks, vegetable/fruit references, complete visual-key coverage, validation,
  and idempotent application.
- Pure server tests cover preview, rebasing, week boundaries, completion, and
  the week-11 fallback.
- Postgres route tests cover auth, input validation, start conflicts, seeded
  responses, ordering, and list scoping.
- Mobile tests cover store lifecycle, start/resume, localized content,
  fallback disclosure, list filtering, navigation, reset, and i18n parity.

## Deferred

- Per-user/per-day task completion persistence.
- Week 11 until its authoritative source PDF is supplied.
- A resource-library model for recipes, special situations, maintenance,
  comeback/plateau guides, and other supplemental PDFs.
- The workout guide, which belongs to a separate fitness feature.
