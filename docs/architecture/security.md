# Security posture

> Living document. Every cross-cutting security change updates this file.

## Authentication

- Passwords: **bcrypt**, cost 12. Minimum length 10, NIST-style (no forced
  complexity classes but checked against common-password list).
- Tokens: **JWT** access (15 min, HS256, short-lived) + rotating **refresh**
  (30 days, stored hashed). Refresh rotation on every use; old token revoked.
- Storage on device: access token in memory only; refresh in the platform
  secure store (`expo-secure-store`). Never in AsyncStorage.
- Logout: revokes current refresh and clears secure store.

## Authorization

- Every non-public route requires a valid access token (`requireAuth`).
- Every couple-scoped route additionally passes `requireCoupleMember` which
  verifies the user belongs to the couple referenced by the resource. 403 on
  mismatch.
- Reactions: caller must be a member of the same couple as the subject.

## Transport & headers

- TLS everywhere in production (terminated at platform load balancer).
- `@fastify/helmet` with a strict CSP for the web health page.
- CORS: allowlist from `CORS_ORIGINS` env, credentials allowed only for Expo
  origins.

## Input validation

- **Zod** schemas on every request body, query, and params. Shared with the
  mobile client via `packages/shared`.
- Reject unknown fields (`.strict()`).
- Numeric bounds on weight (20–300 kg), height (50–250 cm), age derived from
  `birth_date` (10–120).

## Database

- Kysely with parameterized queries — no string concatenation.
- Least-privilege DB user (read/write on app schema only; no DDL at runtime).
- Migrations run via a separate role with DDL rights, only in CI/deploy.

## Rate limiting

- `@fastify/rate-limit` on `/auth/*` write routes (5 req/min/IP) and write
  routes generally (60 req/min/user).
- Socket.IO: max 120 messages/min per socket; excess = disconnect.

## Secrets

- Only via env vars. `.env` gitignored; `.env.example` committed.
- CI uses repository secrets; prod uses the platform secret store.

## PII & logging

- Never log passwords, tokens, emails, or names at info level.
- Request logs carry `userId` (uuid) only.
- Error logs redact request bodies (`pino` redaction rules).

## OWASP Top 10 checklist (tracked)

- [ ] A01 Broken access control → `requireCoupleMember` unit tests.
- [ ] A02 Cryptographic failures → bcrypt 12, TLS, hashed refresh.
- [ ] A03 Injection → zod + Kysely.
- [ ] A04 Insecure design → this doc.
- [ ] A05 Misconfig → helmet + strict CORS + security headers audit.
- [ ] A07 Authn failures → rate limit + refresh rotation.
- [ ] A08 Data integrity → signed JWTs; refresh token rotation.
- [ ] A09 Logging/monitoring → pino + error tracking.
- [ ] A10 SSRF → no outbound user-controlled URLs in MVP.

Each item is marked done when the corresponding tests + middleware exist.
