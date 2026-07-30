# AGENTS.md — FitnessApp agent guide

> This file tells automated agents (and humans scanning for context) how to
> work in this repo. Keep it current when cross-cutting conventions change.

## Project at a glance

Bilingual (HE/EN) couples fitness app. React Native (Expo) mobile client +
Node.js (Fastify) backend + Postgres. Real-time partner sync via Socket.IO.
Diet planning grounded in the Israeli **אבא חטוב (Aba Hatuv)** program.

See [`README.md`](README.md) for the elevator pitch and
[`docs/architecture/overview.md`](docs/architecture/overview.md) for the phase plan.
Treat [`docs/design/design.md`](docs/design/design.md) as the source of truth for
mobile themes, components, motion, accessibility, and food artwork.

## Ground rules (non-negotiable)

1. **TDD.** Failing test first, then implementation. Coverage ≥ 80 % per workspace.
2. **Security by default.** Zod-validate every input, parameterized SQL only,
   rate-limit auth + write routes, authn on every route, couple-scope check on
   every couple-scoped resource.
3. **Readable > clever.** Descriptive names, small modules, single responsibility.
   Big-O: prefer indexed queries and bounded loops; call out anything > O(n log n).
4. **Modularity.** Components and helpers under 200 lines where possible. Extract
   pure helpers into `lib/` and unit-test them in isolation.
5. **Bilingual first.** Every user-visible string goes through i18n; no raw
   Hebrew/English literals in components. RTL must look correct.
6. **Docs co-evolve.** Touching a feature? Update its page in `docs/features/`
   and this file / `README.md` if the touch is cross-cutting. New decision?
   Add a numbered ADR in `docs/decisions/`.
7. **Self code-review the diff before committing.** Run `git diff`, look for
   reuse, secrets, missing tests, dead code.

## Common commands

```bash
# Install / bootstrap
pnpm install

# Quality gates
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage

# Local dev
pnpm db:up            # Postgres via docker compose
pnpm dev:server       # Fastify with reload
pnpm dev:mobile       # Expo dev server

# Per-workspace
pnpm --filter @fitnessapp/server <script>
pnpm --filter @fitnessapp/mobile <script>
pnpm --filter @fitnessapp/shared <script>
```

## Branching & commits

- **Branch:** all scaffolding + MVP work is on `Codex/project-planning-Ho70i`.
- **Commits:** imperative mood, scoped by area, e.g.
  `server(auth): add register endpoint`,
  `mobile(profile): RTL layout for profile screen`.
- **Phase commits:** each phase in the plan lands as one or more cohesive
  commits; never mix scaffolding with feature logic.

## Where things live

| Concern | Path |
|---|---|
| Mobile screens | `apps/mobile/src/screens/` |
| MobX stores | `apps/mobile/src/stores/` |
| i18n resources | `apps/mobile/src/i18n/{he,en}/` |
| Server modules | `apps/server/src/modules/<feature>/` |
| DB migrations | `apps/server/src/db/migrations/` |
| Seed data (Aba Hatuv) | `apps/server/src/db/seeds/aba-hatuv/` |
| Pure helpers | `apps/server/src/lib/` |
| Shared DTOs + events | `packages/shared/src/` |
| Feature docs | `docs/features/<feature>.md` |
| Design system | `docs/design/design.md` |
| ADRs | `docs/decisions/NNNN-<slug>.md` |

## Adding a feature — checklist

- [ ] Spec + data-model change in `docs/features/<feature>.md`.
- [ ] Shared types/schemas in `packages/shared` (server + mobile import them).
- [ ] Server module under `apps/server/src/modules/<feature>/` with:
  - route handlers, zod validators, service layer, DB layer;
  - couple-scope middleware where relevant;
  - integration tests via Supertest + testcontainers-postgres.
- [ ] Mobile MobX store + screens + components; i18n strings in both `he` and `en`.
- [ ] Tests in both workspaces; coverage ≥ 80 %.
- [ ] `README.md`, this file, and relevant ADR updated if cross-cutting.
- [ ] Self-review the diff.

## Things NOT to do

- Don't use `any` or `@ts-ignore` without an ADR.
- Don't hand-build SQL strings; use Kysely's typed builder.
- Don't log PII (emails, names) at info level.
- Don't skip the coverage gate; fix the test, not the threshold.
- Don't commit secrets; use `.env` (gitignored) and platform secret stores.
