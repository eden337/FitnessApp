# Feature — Couples

**Status:** Phase 2 — implemented on server and mobile.

## Goal

Let two users form a **couple** — a shared sync unit — via a short invite
code, so every subsequent write is visible to their partner in real time.

## Flow

1. Partner A: taps "Pair with partner" → server creates a couple, returns
   `inviteCode` (8 chars, unambiguous alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
2. Partner B: enters the code → server looks up the couple, adds them as
   `member`.
3. Both clients reconnect their sockets and are joined to `couple:<id>`.

## Surface

- REST: `POST /couples`, `POST /couples/join`, `GET /couples/me`, `DELETE /couples/me`.
- Mobile: `PairScreen` (generate + share code), `JoinScreen` (enter code),
  `PartnerCard` component on the home feed.
- MobX: `CoupleStore` (observable `couple`, `partner`; actions `create`,
  `join`, `leave`).

## Rules

- A user can belong to at most one couple (partial unique index on
  `couple_members.user_id WHERE left_at IS NULL` if/when soft-leave is added;
  v1 uses a hard DELETE on leave).
- The owner cannot be removed while other members exist; leaving disbands the
  couple only if zero members remain.

## Tests

- Happy path: A creates, B joins, both see each other via `GET /couples/me`.
- Code collision: server retries code generation until unique (bounded).
- Access: non-member gets 403 on couple-scoped routes; verified per route.
- Socket integration covers authenticated room membership and member
  join/leave events. Progress activity events remain part of Phase 4.
