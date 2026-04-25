# Feature — Authentication

**Status:** Phase 1 — fully implemented (server + mobile).

## Goal

Enable each partner to register, log in, stay logged in across app launches,
and revoke sessions safely. Bilingual UX (HE/EN) from the very first screen.

## User stories

- As a new user, I can sign up with email + password and am taken to the
  profile-setup screen.
- As a returning user, I am logged in silently on app launch if my refresh
  token is valid.
- As a user, I can sign out and my refresh token is revoked server-side.

## REST surface

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | email, password, displayName, locale, gender, birthDate, heightCm | Create account; returns user + token pair |
| POST | `/api/v1/auth/login` | — | email, password | Issue tokens |
| POST | `/api/v1/auth/refresh` | — | refreshToken | Rotate refresh; revokes old |
| POST | `/api/v1/auth/logout` | — | refreshToken | Revoke refresh token |
| GET | `/api/v1/auth/me` | access | — | Return current user profile |

Schemas live in `packages/shared/src/schemas/auth.ts` and are imported on
both ends of the wire.

## Token model (ADR 0005)

- **Access:** JWT HS256, TTL 15 min, kept in memory on the client.
- **Refresh:** 48-byte base64url string, hashed (SHA-256) at rest, TTL 30 days,
  rotated on every refresh (old token revoked, single grace window of 0).
- **Storage on device:** access in memory, refresh in `expo-secure-store`
  (via `nativeSecureStorage.ts`).

## Mobile flow

- `AuthStore` (`apps/mobile/src/stores/AuthStore.ts`):
  `signUp / signIn / signOut / hydrate / handleAuthFailure`.
- On app launch, `hydrate()` reads the refresh token from secure storage
  and calls `/auth/refresh` to silently restore the session.
- `apiClient.ts` injects the access token on every request and on a 401
  refreshes once (deduplicated across concurrent calls), retrying the
  original request transparently. If refresh itself fails it calls
  `onAuthFailure`, which clears state in the AuthStore.
- Screens (`SignInScreen`, `SignUpScreen`) translate server error codes
  via `auth:errors.<code>` keys, falling back to `auth:errors.fallback`.

## Validation

- `email`: trimmed, lowercased, RFC 5322, ≤ 254 chars.
- `password`: min 10 chars (server + client).
- `displayName`: 1–60 chars, trimmed.
- Profile-side fields (gender, birthDate, heightCm) validated per
  `user.ts` schemas.

## Non-functional

- Rate limit on `register` + `login`: 5 req/min/IP. Disabled in `NODE_ENV=test`,
  with a dedicated `tests/rate-limit.test.ts` covering the production path.
- Bcrypt cost 12 in production, 4 in tests.
- Refresh tokens are revoked on logout; reuse returns 401.

## Tests

- **Server:** `tests/auth.test.ts` (Supertest), `tests/rate-limit.test.ts`.
- **Mobile:** `__tests__/AuthStore.test.ts`, `__tests__/apiClient.test.ts`,
  `__tests__/SignInScreen.test.tsx`, `__tests__/SignUpScreen.test.tsx`.
- Pure helpers (`bmr`, `calorie-target`, `password`, `tokens`) unit-tested
  in isolation.
