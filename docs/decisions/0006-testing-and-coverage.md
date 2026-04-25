# ADR 0006 — Testing strategy & coverage gate

**Status:** accepted · **Date:** 2026-04-24

## Context

The brief mandates TDD and **≥ 80 % coverage**. We want that gate enforced
uniformly across server, mobile, and shared code without becoming a drag.

## Decision

- **Jest** everywhere (server, mobile, shared) — one mental model.
- **Server:** Jest + Supertest for HTTP; real Postgres in tests via
  `@testcontainers/postgresql` (no in-memory shim; behaviour matches prod).
  Socket.IO tested against a real server + client pair.
- **Mobile:** Jest + `@testing-library/react-native` for components/screens;
  MobX stores unit-tested in isolation (no React). `msw` for REST mocking,
  `mock-socket` for socket flows. Snapshot tests in both `he` and `en`.
- **Shared:** pure-function tests on zod schemas and domain helpers.

**Coverage gate:** `jest --coverage` with `coverageThreshold` global 80 %
(statements, branches, functions, lines). Enforced in each workspace's
`jest.config.ts` so `pnpm test:coverage` fails locally too. CI runs the same
command.

**TDD flow:** red → green → refactor. Every public behaviour ships with at
least one integration test that exercises it end-to-end (HTTP or render-
interact-assert on mobile).

## Consequences

- **Pros:** one tool, consistent reports; the gate catches regressions early
  and protects against "tests for coverage" by requiring integration tests
  for public behaviour.
- **Cons:** testcontainers requires Docker locally (already required by the
  project). First run is slow; subsequent runs are fast because the image
  is cached.

## Alternatives considered

- **Vitest:** great for Vite projects, awkward for React Native. Using Jest
  across the board keeps tooling consistent.
- **Lower threshold (60–70 %):** rejected — the user explicitly asked for 80 %.
