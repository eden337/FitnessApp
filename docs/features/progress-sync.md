# Feature — Progress and partner sync

**Status:** Maintenance-only private weight entry, history, and trends
implemented; partner feed, goals, and reactions remain.

## Product boundary

The Aba Hatuv foundation program forbids weighing throughout all 13 weeks.
Initial weight is private profile setup data, not program progress.

Weight logging and history unlock only after `/program/me/current` reports
`completed`. Before then, the mobile app does not fetch or show weight progress,
and both weight endpoints return `409 maintenance_only`.

## Implemented maintenance slice

- `POST /api/v1/progress/weight` creates or replaces one private measurement
  for the authenticated user and calendar day.
- `GET /api/v1/progress/weight?from=&to=&limit=` returns only the caller's
  bounded, newest-first history.
- The latest dated log updates `user_metrics.current_weight_kg`; an older
  measurement cannot replace a newer current value.
- `ProgressStore` and the bilingual `ProgressScreen` support weight, optional
  date/body-fat/notes, history, errors, and logout reset.
- The private maintenance chart supports 30, 90, and 365-day windows. Its
  reducer uses inclusive calendar dates and neutral low/high/change language.
- Weight is never shared by default and emits no Socket.IO event.

## Planned maintenance work

- Habit-fallback signals that help preserve the program's principles.
- Explicit consent design before any partner-visible body information.
- Partner feed, goals, achievements, and reactions for non-private actions.

## Tests

- Server service and integration tests enforce the maintenance-only boundary.
- Mobile navigation tests ensure the route is absent during foundation.
- Chart reducer tests cover date boundaries, normalization, and empty data.
- Realtime events and reactions must remain scoped, consent-aware, and idempotent.
