# ADR 0001 — Monorepo + stack

**Status:** accepted · **Date:** 2026-04-24

## Context

We are building a couples fitness app with a shared TypeScript surface
between the mobile client and the Node.js backend (DTOs, validation schemas,
Socket.IO event shapes). We want type-safety end-to-end, fast iteration, and
a coverage gate that can be enforced uniformly.

## Decision

Use a **pnpm workspaces monorepo** with:

- `apps/server` — Node.js 20 + Fastify + Kysely + Postgres + Socket.IO.
- `apps/mobile` — React Native (Expo) + TypeScript + MobX + react-i18next.
- `packages/shared` — TypeScript + zod; source of truth for DTOs, validation,
  and socket event schemas, consumed by both apps.

Quality tooling: ESLint, Prettier, tsc `--noEmit`, Jest, coverage gate ≥ 80 %.
CI: GitHub Actions.

## Consequences

- **Pros:** shared types prevent client/server drift; single install; uniform
  scripts; easy refactors across the boundary.
- **Cons:** pnpm's virtual store is unfamiliar to some contributors; Expo +
  pnpm requires `node-linker=hoisted` (documented in `.npmrc`).

## Alternatives considered

- Two repos + a published `@fitnessapp/shared` package — more ceremony, slower
  feedback loop.
- Nx / Turborepo — overkill for two apps + one package; pnpm workspaces are
  sufficient.
