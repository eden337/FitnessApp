# Feature — Authentication

**Status:** Phase 1a — implemented (server-side). Mobile screens land in 1b.

## Goal

Enable each partner to register, log in, stay logged in across app launches,
and revoke sessions safely. Support bilingual UX (HE/EN) from the very first
screen.

## User stories

- As a new user, I can sign up with email + password and am taken to the
  profile-setup screen.
- As a returning user, I am logged in silently on app launch if my refresh
  token is valid.
- As a user, I can sign out and my refresh token is revoked server-side.

## Surface (REST)

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | `RegisterServerSchema` (email, password, displayName, locale, gender, birthDate, heightCm) | Create account; returns user + token pair |
| POST | `/api/v1/auth/login` | — | `LoginInputSchema` (email, password) | Issue tokens |
| POST | `/api/v1/auth/refresh` | — | `RefreshInputSchema` (refreshToken) | Rotate refresh; revokes old |
| POST | `/api/v1/auth/logout` | — | `RefreshInputSchema` | Revoke refresh token |
| GET | `/api/v1/auth/me` | access | — | Return current user profile |

Schemas are defined in `packages/shared/src/schemas/auth.ts` and re-imported
by both server and (eventually) mobile.

## Token model (ADR 0005)

- **Access:** JWT HS256, TTL 15 min, kept in memory on the client.
- **Refresh:** 48-byte base64url string, hashed (SHA-256) at rest, TTL 30 days,
  rotated on every refresh (old token revoked, single grace window of 0).
- **Storage on device:** access in memory, refresh in `expo-secure-store`.

## Validation

- `email`: trimmed, lowercased, RFC 5322, ≤ 254 chars.
- `password`: min 10 chars, max 256.
- `displayName`: 1–60 chars, trimmed.
- `gender`, `locale`, `birthDate`, `heightCm` validated per `user.ts` schemas.

## Non-functional

- Rate limit on `register` + `login`: 5 req/min/IP (`@fastify/rate-limit`).
- Disabled when `NODE_ENV === 'test'` so the test suite isn't tripped; an
  explicit `tests/rate-limit.test.ts` exercises the production path.
- Bcrypt cost 12 in production, 4 in tests for speed.
- Refresh tokens are revoked on logout; a revoked token returns 401 on reuse.
- Login response time is approximately constant whether the email exists or
  not (a dummy verify is issued for the unknown-email path).

## Error mapping

| Code | HTTP |
|---|---|
| `invalid_body` | 400 |
| `invalid_credentials` | 401 |
| `unauthenticated` | 401 |
| `invalid_refresh` | 401 |
| `not_found` | 404 |
| `email_in_use` | 409 |
| Rate limit exceeded | 429 |

## Tests

- `tests/auth.test.ts` — full Supertest coverage of every public route, error
  branches, and refresh rotation revocation.
- `tests/rate-limit.test.ts` — verifies 429 on the 6th register inside one
  minute, with rate limiting forced on.
- `src/lib/{password,tokens,bmr,calorie-target}.test.ts` — pure unit tests on
  the cryptographic and personalization helpers.
