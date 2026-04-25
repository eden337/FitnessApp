# CLAUDE.md — server workspace

Node.js 20 + Fastify + Kysely + Postgres + Socket.IO. TypeScript strict mode.
Phase 0 provided the health endpoint and env loader. Phase 1a adds:
- DB schema (users, user_metrics, refresh_tokens) via SQL migrations.
- Pure personalization helpers (BMR, calorie target) in `lib/`.
- `auth` module: register/login/refresh/logout/me + rate limiting.
- `users` module: profile + metrics CRUD + server-derived BMR/TDEE/target.
- `requireAuth` middleware reading Bearer access tokens.

Mobile screens for these flows land in Phase 1b.

## Layout

```
src/
  app.ts            # buildApp(): wires plugins + routes, no listen()
  server.ts         # entry point: load env, build, listen
  config/env.ts     # zod-validated env loader (single source of truth)
  modules/<feature> # one folder per feature: routes, service, repo, tests
  db/
    migrations/     # numbered .sql or .ts migration files
    seeds/          # versioned reference data (Aba Hatuv)
    migrate.ts      # runner
    seed.ts         # runner
  middleware/       # auth, rbac, rate-limit, zod validators
  lib/              # pure helpers (BMR, calorie target, portion math)
tests/              # integration tests via app.inject()
```

## Conventions

- **Never** read `process.env` outside `config/env.ts` — always receive `env` as a dep.
- Every handler calls a service; every service calls a repository. Routes are
  thin (validate → delegate → serialize).
- All SQL goes through Kysely; no raw string concatenation.
- Zod schemas for requests are **imported from `@fitnessapp/shared`**, not
  redefined here. Keep client ↔ server in lock-step.
- `app.inject(...)` for fast unit/integration tests; no HTTP listener in tests.
- Log with `app.log`; never `console.log` in production code.

## Scripts

```bash
pnpm --filter @fitnessapp/server dev
pnpm --filter @fitnessapp/server test
pnpm --filter @fitnessapp/server test:coverage
pnpm --filter @fitnessapp/server typecheck
pnpm --filter @fitnessapp/server build
```

## Adding a feature module

1. Create `src/modules/<feature>/{routes.ts,service.ts,repo.ts,index.ts}`.
2. Add request/response zod schemas to `packages/shared`; import here.
3. Register in `app.ts` under a versioned prefix (`/api/v1/<feature>`).
4. Add integration tests to `tests/<feature>.test.ts`.
5. Update `docs/features/<feature>.md`.
