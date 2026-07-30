# Feature — Progress & partner sync

**Status:** Phase 4a — private weight entry and history implemented; partner
feed, charts, goals, and reactions remain.

## Goal

Capture weight + optional body-fat over time, draw the line chart both
partners can see, let users set and achieve goals, and surface a **live
partner feed** of meals, weigh-ins, goal achievements, and reactions.

## Surface

- REST: `POST/GET /progress/weight`, `POST/PATCH /progress/goals`,
  `POST /progress/reactions`, `GET /progress/feed?since=`.
- Socket events: `meal:logged`, `water:logged`, `weight:logged`,
  `goal:achieved`, `reaction:sent` (see `docs/architecture/sync-realtime.md`).
- Mobile:
  - `WeightLogModal` (quick entry).
  - `ProgressScreen` with charts (`victory-native`).
  - `FeedScreen` — merged timeline of both partners' events.
  - `ReactionBar` component on every feed card.

## Implemented weight slice

- `POST /api/v1/progress/weight` creates or replaces one measurement for the
  authenticated user and calendar day.
- `GET /api/v1/progress/weight?from=&to=&limit=` returns only the caller's
  bounded, newest-first history.
- The latest dated log updates `user_metrics.current_weight_kg`; entering an
  older measurement cannot replace a newer current value.
- `ProgressStore` and the bilingual `ProgressScreen` support weight, optional
  date/body-fat/notes, history, errors, and logout reset.
- Measurements are private and no progress Socket.IO event is emitted yet.

This deliberate privacy boundary remains until partner-sharing consent and
feed visibility are designed.

## Charts

- Weight line chart, 7 / 30 / 90 / 365 day windows; moving-average overlay.
- Streak indicator: consecutive days with at least one meal log.

## Goals

- Types: `weight_target`, `streak_days`, `adherence_pct`.
- Achieved when the corresponding metric crosses the target at least once
  (server-side check on every relevant write).

## Tests

- Chart data: given a sequence of logs, the reducer produces the expected
  series for each window.
- Goals: achievement fires exactly once; idempotent on repeat writes.
- Sockets: write on A → emit on room → B receives and updates store.
- Reactions: duplicate reactions are idempotent (unique constraint).
