# Real-time sync

## Model

- One **couple** = one room (`couple:<id>`).
- The DB is the source of truth; Socket.IO is a fan-out channel.
- Events are only emitted **after** the corresponding DB transaction commits.
- On (re)connect the client calls `GET /progress/feed?since=<lastTs>` to
  reconcile anything it missed.

## Connection lifecycle

```
client connect (JWT in `auth.token`)
  └─► server: verify JWT, look up couple_id
        ├── couple_id null  → disconnect (client must create/join couple first)
        └── couple_id set    → socket.join(`couple:<id>`) → emit `ready`
```

## Event schema

All events are defined once in `packages/shared/src/events/*.ts` as zod
schemas. The server validates outgoing payloads against the schema; the
client validates incoming payloads (so a malformed server doesn't crash the
UI).

```ts
// packages/shared/src/events/meal.ts (illustrative)
export const MealLoggedEvent = z.object({
  by: z.string().uuid(),
  log: MealLogDto,
});
```

## Ordering & idempotency

- Every event carries a `createdAt` timestamp from the backing row.
- The client keeps a per-room `lastSeenAt` in `SocketStore` and drops events
  with `createdAt <= lastSeenAt` during reconciliation.
- Reactions are idempotent: `(couple_id, from_user_id, subject_id, kind)` is
  unique; a repeat POST returns 200 with the existing row.

## Failure modes

- **Socket drops mid-session:** client auto-reconnects (Socket.IO default);
  reconciles via `/feed?since=`.
- **JWT expires on socket:** server disconnects with reason `token_expired`;
  client refreshes and reconnects.
- **Backend restart:** rooms rebuild on demand as clients reconnect; no
  persistence needed in-memory.

## Testing

- Server: spin up real Socket.IO with a test HTTP server; integration tests
  assert that a write on client A produces the expected event on client B
  connected to the same couple room.
- Mobile: `mock-socket` in store tests + `msw` for the REST reconcile path.
