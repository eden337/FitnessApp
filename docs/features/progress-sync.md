# Feature — Progress and partner sync

**Status:** Maintenance-only private weight entry, history, and trends plus a
privacy-safe shared-wins feed are implemented; realtime and reactions remain.

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

## Implemented shared-wins slice

- Users explicitly share one of five reviewed actions: hydration, colorful
  vegetables, movement, a meal together, or encouragement.
- `POST /api/v1/progress/activities` accepts the safe action and an optional
  160-character note. Unknown fields and action kinds are rejected.
- `GET /api/v1/progress/feed?since=&limit=` returns only the caller's current
  couple feed. Membership is resolved and locked in the same DB transaction.
- Reconciliation includes the timestamp boundary; `ActivityStore` deduplicates
  by activity ID so sub-millisecond database precision cannot lose an event.
  Initial reads are newest-first; `since` batches are oldest-first so a bounded
  reconciliation loop cannot skip intermediate events.
- The bilingual Shared Wins screen is opened from the paired partner card and
  uses colorful, theme-safe emoji tiles plus reduced-motion-aware celebration.
- No body measurement, calorie, profile, or private program fields exist in the
  shared activity schema or table.

## Planned maintenance work

- Habit-fallback signals that help preserve the program's principles.
- Realtime Socket.IO delivery of persisted shared wins.
- Goals, achievements, and reactions for non-private actions.
- Any future body-information sharing requires a separate explicit-consent ADR.

## Tests

- Server service and integration tests enforce the maintenance-only boundary.
- Mobile navigation tests ensure the route is absent during foundation.
- Chart reducer tests cover date boundaries, normalization, and empty data.
- Shared schema and integration tests reject unsafe kinds and enforce current
  couple scope.
- Realtime events and reactions must remain scoped, consent-aware, and idempotent.
