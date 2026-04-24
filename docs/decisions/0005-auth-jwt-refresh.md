# ADR 0005 — Auth: email+password + JWT with rotating refresh

**Status:** accepted · **Date:** 2026-04-24

## Context

We need authentication that is simple for a two-person app, safe against the
usual attacks, and friendly to a mobile client that may be offline. Social
login is explicitly out of scope for v1 (per clarifying Q&A).

## Decision

- **Registration:** email + password (min 10 chars, checked against a
  common-password list). Passwords hashed with **bcrypt** (cost 12).
- **Access token:** JWT, HS256, TTL 15 minutes. Kept in memory on device.
- **Refresh token:** opaque random string, TTL 30 days, hashed at rest in
  `refresh_tokens`. Stored on device in `expo-secure-store`. Rotated on
  every `/auth/refresh`; the old token is revoked (grace window 0).
- **Logout:** revokes the current refresh token.
- **Rate limits:** 5 req/min/IP on `/auth/register` and `/auth/login`.

## Consequences

- **Pros:** offline-tolerant (short-lived access can be revalidated silently
  via refresh); no third-party dependency; revocable; PII minimized.
- **Cons:** password recovery flow (email-link) needed before public launch;
  deferred to v2 since v1 is invite-only for the two of us.

## Alternatives considered

- Session cookies: awkward on React Native; requires the server to manage
  state more actively.
- OAuth (Google): nice UX but adds an external dependency and a second code
  path we would need to test.
