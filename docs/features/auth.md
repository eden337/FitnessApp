# Feature — Authentication

**Status:** Phase 1 (not yet implemented).

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

## Surface

- REST: `POST /auth/{register,login,refresh,logout}`, `GET /auth/me`.
- Mobile screens: `SignUpScreen`, `SignInScreen`, silent refresh flow.
- MobX: `AuthStore` (observable `user`, `status`, `tokens`; actions `signUp`,
  `signIn`, `signOut`, `refresh`).

## Validation (zod, shared)

- `email`: RFC 5322, lowercased server-side.
- `password`: min 10 chars, rejected if in common-password list.
- `displayName`: 1–60 chars.
- `locale`: `'he' | 'en'`.

## Non-functional

- Rate-limit `register` + `login`: 5 req/min/IP.
- Refresh rotation with old-token revocation; see ADR 0005.
- Access in memory only; refresh in `expo-secure-store`.

## Tests (definition of done)

- Server: 200/400/401/429 paths covered; refresh rotation revokes old token;
  zod rejects malformed bodies.
- Mobile: `AuthStore` transitions through idle → loading → authenticated on
  success and → error on 401. Snapshot tests in HE + EN.
