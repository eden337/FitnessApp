# ADR 0003 — Couple pairing model

**Status:** accepted · **Date:** 2026-04-24

## Context

The app's central motivator is partner accountability. We need a way to link
two (and potentially more) accounts so they share a progress feed, see each
other's logs in real time, and react to each other — without merging accounts
or exposing one person's raw data to the world.

## Decision

Model it as a **Couple** entity with many members:

- `couples(id, invite_code)`
- `couple_members(couple_id, user_id, role)`

Flow:

1. Each partner creates their own account.
2. One partner calls `POST /couples` → server returns a short, human-readable
   `invite_code` (e.g. 8 characters, unambiguous alphabet).
3. The other partner calls `POST /couples/join` with the code and is added as
   `member`.
4. All couple-scoped reads/writes go through `requireCoupleMember` middleware.
5. Socket.IO joins everyone to room `couple:<id>`.

## Consequences

- **Pros:** clean access-control boundary; extensible to >2 members (family
  mode later); each user retains their own auth and raw data.
- **Cons:** more tables than a flat "friend" model; we must prevent a user
  from belonging to multiple couples simultaneously in v1 (enforced by a
  partial unique index on `couple_members.user_id`).

## Alternatives considered

- **Friend follow model:** symmetric follows. Works but lacks the "we are a
  unit" framing, makes aggregate goals harder to model.
- **Single shared login:** violates authentication hygiene and prevents per-
  user personalization (different BMR, different logs).
