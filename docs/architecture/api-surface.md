# API surface (REST + Socket.IO)

All routes are prefixed `/api/v1`. All payloads are JSON validated by zod
schemas defined in `packages/shared` (identical validation on client and
server).

## Conventions

- Auth: `Authorization: Bearer <access_token>` except where noted.
- Errors: `{ error: { code, message, details? } }` with appropriate status.
- Timestamps: ISO 8601, UTC.
- Pagination (when introduced): cursor-based `?after=<id>&limit=<n>` (max 100).

## Auth (`/auth`)

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/register` | — | `{ email, password, displayName, locale }` | Create account; returns tokens |
| POST | `/login` | — | `{ email, password }` | Issue access + refresh tokens |
| POST | `/refresh` | refresh | `{ refreshToken }` | Rotate refresh; return new tokens |
| POST | `/logout` | access | — | Revoke current refresh token |
| GET | `/me` | access | — | Return current user DTO |

Rate limit: 5 req / min / IP on `/register` + `/login`.

## Users (`/users`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/me/profile` | full profile + metrics |
| PATCH | `/me/profile` | update display_name, locale, height, birth_date, gender |
| PATCH | `/me/metrics` | update weight, activity, dietary restrictions, goal |

## Couples (`/couples`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create a couple (owner = caller); returns `{ id, inviteCode }` |
| POST | `/join` | `{ inviteCode }` → join existing couple |
| GET | `/me` | Current user's couple + members' public profiles |
| DELETE | `/me` | Leave the couple |

## Program (`/program`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/me/current` | Current bilingual week, guidance, tasks, and timeline metadata |
| POST | `/me/start` | `{ currentWeekNumber }` → start/resume once from week 1-13 |
| GET | `/lists?weekNumber=` | Global food lists plus lists scoped to the effective week |

The timeline uses Israel calendar dates. Scheduled week 11 explicitly returns
week-10 content with `isFallback: true`; week 12 resumes on schedule. Starting
is rate-limited and requires initialized metrics.

## Progress (`/progress`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/weight` | Upsert the caller's private daily `{ loggedOn?, weightKg, bodyFatPct?, notes? }` |
| GET | `/weight?from=&to=&limit=` | Caller-only history, newest first; limit 1–365 |
| POST | `/activities` | Explicitly share a safe `{ kind, note? }` couple win |
| GET | `/feed?since=&limit=` | Current-couple shared wins; inclusive cursor, limit 1–100 |
| POST | `/goals` | Create a goal |
| PATCH | `/goals/:id` | Update / mark achieved |
| POST | `/reactions` | `{ subjectType, subjectId, kind }` |

Weight entries remain private and never appear in the feed. Shared activities
are limited to the reviewed enum in ADR 0010.

## Socket.IO (`/`)

Namespace default `/`. Room model: `couple:<coupleId>`.

**Client → server**

| Event | Payload | Notes |
|---|---|---|
| `hello` | `{ }` | Server resolves couple from JWT and joins room |

**Server → client** (all emitted after DB commit)

| Event | Payload shape (see `packages/shared/src/events`) |
|---|---|
| `meal:logged` | `{ by: userId, log: MealLogDto }` |
| `water:logged` | `{ by: userId, amountMl, total: number }` |
| `weight:logged` | `{ by: userId, log: WeightLogDto }` |
| `goal:achieved` | `{ by: userId, goal: GoalDto }` |
| `reaction:sent` | `{ from: userId, subjectType, subjectId, kind }` |

## Versioning

Breaking changes increment the path prefix (`/api/v2`). Shared zod schemas are
versioned alongside; the mobile client pins a version in `app.config.ts`.
