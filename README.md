# FitnessApp

Bilingual (Hebrew / English) couples fitness companion. Plans meals around the
**אבא חטוב (Aba Hatuv)** program, tracks progress against personalized goals
(gender, height, weight, age, activity), and keeps two partners in sync in
real time so they can push each other forward.

> Status: **Phase 4c — privacy-safe shared wins**. Aba Hatuv program guidance,
> couples, authentication, and profile setup are implemented. See
> [`docs/architecture/overview.md`](docs/architecture/overview.md) for the plan.

## Monorepo layout

```
apps/
  server/     # Node.js (Fastify) + Postgres backend — REST + Socket.IO
  mobile/     # React Native (Expo) + TypeScript + MobX client
packages/
  shared/     # Shared TS types + zod schemas (DTOs + socket events)
docs/
  architecture/   # system, data model, sync, security, i18n
  decisions/      # ADRs (numbered)
  design/         # normative themes, components, motion, and artwork
  features/       # per-feature docs (kept current with the code)
```

## Tech stack

| Layer | Choice |
|---|---|
| Mobile | React Native (Expo) + TypeScript + **MobX** + react-i18next |
| Backend | Node.js 20 + Fastify + Kysely + Postgres 16 + Socket.IO |
| Shared | TypeScript + zod (validates DTOs and socket events on both sides) |
| Tests | Jest + Supertest + `@testing-library/react-native` — **≥ 80 % coverage gate** |
| Dev infra | Docker Compose (Postgres), pnpm workspaces, GitHub Actions CI |
| Auth | Email + password, bcrypt (cost 12), JWT access + rotating refresh |
| Realtime | Socket.IO namespaced rooms keyed on `couple_id` |

## Quickstart (local dev)

Prerequisites: Node 20.11+, pnpm 9+, Docker.

### Complete Docker stack

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, applies migrations, loads the idempotent Aba Hatuv seed,
then starts the API and the Expo web build. Open:

- App: `http://localhost:8081`
- API health: `http://localhost:4000/health`

Adminer is optional: `docker compose --profile tools up --build`, then open
`http://localhost:8080` and use `postgres` as the database host.

The default secrets and database password are suitable only for local
development. Override them in `.env` before exposing the stack. If the browser
will not run on the Docker host, set `PUBLIC_API_URL`, `PUBLIC_SOCKET_URL`, and
`CORS_ORIGINS` to its externally reachable origins before building.

### Split development workflow

```bash
# 1. Install
pnpm install

# 2. Copy env template
cp .env.example .env

# 3. Start Postgres
pnpm db:up

# 4. Run migrations + seeds
pnpm --filter @fitnessapp/server migrate
pnpm --filter @fitnessapp/server seed

# 5. Start backend
pnpm dev:server

# 6. In another shell, start Expo
pnpm dev:mobile
```

For a browser-based UI preview, run
`pnpm --filter @fitnessapp/mobile web`. The preview intentionally uses
in-memory authentication and preferences because Expo SecureStore is a native
facility; refreshing the browser starts a fresh preview session.

## Quality gates

```bash
pnpm lint            # ESLint across all workspaces
pnpm typecheck       # tsc --noEmit across all workspaces
pnpm test            # Jest across all workspaces
pnpm test:coverage   # Same, with coverage reports (CI fails below 80 %)
```

CI runs all four on every push; see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Development workflow

- **TDD.** Write the failing test first; implement only what's needed to make it
  pass. Keep the coverage gate ≥ 80 %.
- **Self-review every diff.** Before committing, run `git diff` and check for
  reuse opportunities, naming, security issues, and missing tests.
- **Docs live with code.** Every feature has a corresponding page under
  `docs/features/`. ADRs live under `docs/decisions/`. This README and
  `CLAUDE.md` are updated whenever a cross-cutting change lands.
- **Branch.** Current MVP work lands on `Codex/project-planning-Ho70i`.

## Where to go next

- [`docs/design/design.md`](docs/design/design.md) — source of truth for the mobile visual system.

- [`docs/architecture/overview.md`](docs/architecture/overview.md) — system overview and phase plan.
- [`docs/architecture/data-model.md`](docs/architecture/data-model.md) — ER model and table reference.
- [`docs/decisions/`](docs/decisions/) — why each choice was made.
- [`CLAUDE.md`](CLAUDE.md) — agent conventions, common commands.
