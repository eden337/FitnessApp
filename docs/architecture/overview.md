# Architecture overview

## Purpose

FitnessApp is a two-tier system: an Expo / React Native mobile client and a
Node.js (Fastify) backend backed by Postgres. It serves a **couple** — two (or
more) members who share a group, see each other's progress live, and react to
each other. The diet engine is seeded from the Hebrew **Aba Hatuv** program.

## Context diagram

```
 ┌──────────────────┐        HTTPS (REST) + WSS (Socket.IO)       ┌────────────────────┐
 │                  │ ◄───────────────────────────────────────────►                    │
 │  Expo RN client  │                                               │  Fastify server    │
 │  (TS + MobX +    │                                               │  (TS + Kysely +    │
 │   react-i18next) │                                               │   Socket.IO)       │
 │                  │                                               │                    │
 └──────────────────┘                                               └─────────┬──────────┘
                                                                              │ SQL
                                                                              ▼
                                                                     ┌────────────────┐
                                                                     │  Postgres 16   │
                                                                     └────────────────┘
```

## Request flow (REST)

1. Mobile: user action → MobX store method → `services/api.ts` HTTP call.
2. Fastify: `helmet` → `cors` → `rate-limit` → JWT auth middleware → zod body
   validation → route handler → service → Kysely repository → Postgres.
3. Response: service returns DTO → handler serializes → store updates
   observable state → screens re-render.

## Realtime flow (Socket.IO)

- Client connects to `wss://.../socket.io` presenting its JWT.
- Server authenticates, resolves the user's `couple_id`, and joins the socket
  to room `couple:<id>`.
- Any write endpoint (meal log, weigh-in, reaction, goal achieved) emits a
  structured event (validated against a zod schema in `packages/shared`) to
  the room **after** the DB write commits.
- On reconnect, the client calls `GET /feed?since=<ts>` to reconcile any
  events it missed while offline. Socket is fan-out; DB is the source of truth.

## Phase plan

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 — Scaffolding | Monorepo, Docker Compose, CI, ADRs, docs skeleton, health endpoints, i18n bootstrap | `pnpm test` green, coverage gate wired |
| 1 — Auth + profile + i18n | Register / login / refresh; profile CRUD; HE/EN + RTL | End-to-end signup + profile edit works |
| 2 — Couples + sockets | Invite code flow; Socket.IO gateway; shared event schemas | Two accounts paired; events echo live |
| 3 — Diet planner (Aba Hatuv) | Seeded catalog + templates; daily plan generation; meal + water logging | User sees a personalized plan and can log meals |
| 4 — Progress + partner feed | Weight log + chart; goals; live partner feed; reactions | Both partners can see each other's activity in real time |
| 5 — Hardening | Coverage ≥ 80 %; OWASP checklist; docs sweep | All gates pass; docs complete |

## Non-goals (v1)

- Native iOS/Android custom modules (pure RN + Expo).
- Workout planner (deferred to v2; see [feature backlog](../../README.md#where-to-go-next)).
- Nutritionist-editable admin UI (JSON/SQL seeds are sufficient).

See [`data-model.md`](data-model.md), [`sync-realtime.md`](sync-realtime.md),
[`security.md`](security.md), and [`i18n-rtl.md`](i18n-rtl.md) for detail.
