# FitnessApp — ChatGPT Codex hand-off prompt

Paste the block between the `═══` lines below into a fresh ChatGPT Codex
session on your PC. The prompt is self-contained — Codex won't need the
previous Claude conversation to pick up cold.

If Codex is going to help you fill in the Hebrew paragraphs of the Aba
Hatuv seed JSONs (see the "Open item" section below), also re-upload the
12 PDFs into that Codex session — they were ephemeral to the sandbox and
don't live in the repo.

═══════════════════════════════════════════════════════════════

# FitnessApp — continue development from ChatGPT Codex

You are picking up an in-progress project. Read this whole prompt, then
read the referenced files in the repo before writing any code.

## Repo

- **GitHub**: `eden337/FitnessApp`
- **Default branch**: `main`
- **Work on branch**: `claude/project-planning-Ho70i` — all in-flight work
  uses this branch; each phase = one commit merged into `main` via PR.
- Clone:

  ```bash
  git clone https://github.com/eden337/FitnessApp
  cd FitnessApp
  git checkout claude/project-planning-Ho70i
  git pull origin main --ff-only
  ```

## Read these before doing anything

1. `README.md` — quickstart + tech stack.
2. `CLAUDE.md` — root agent guide with rules and layout. Treat as project
   instructions; Codex should follow them.
3. `docs/architecture/overview.md` — system + phase plan.
4. `docs/architecture/data-model.md` — every DB table.
5. `docs/architecture/security.md` + `sync-realtime.md` + `i18n-rtl.md`.
6. `docs/decisions/` — ADRs 0001 → 0007. **Note ADR 0004 is superseded by 0007.**
7. `docs/features/{auth,profile,couples,diet-planner,progress-sync}.md` —
   one per feature; kept current with code.
8. Per-workspace guides: `apps/server/CLAUDE.md`,
   `apps/mobile/CLAUDE.md`, `packages/shared/CLAUDE.md`.

## Tech stack (locked in — do not deviate without an ADR)

- **Monorepo**: pnpm workspaces (`apps/server`, `apps/mobile`, `packages/shared`).
- **Server**: Node.js 20 + Fastify + Kysely + Postgres 16 + Socket.IO. TypeScript strict.
- **Mobile**: Expo (React Native) + TypeScript + MobX + react-i18next. Hebrew default, RTL-aware.
- **Shared**: zod schemas + DTO types imported identically on both ends.
- **Auth**: email + password (bcrypt cost 12), JWT access (15 min) + rotating refresh (30 days, SHA-256 at rest).
- **Realtime**: Socket.IO namespaced rooms keyed on `couple_id`; DB is source of truth, sockets are fan-out.
- **Tests**: Jest everywhere; a CI Postgres service; **≥ 80% coverage gate
  on every workspace** (statements, branches, functions, lines).

## What's shipped (already merged into `main`)

| Phase | What |
|---|---|
| 0 | Monorepo scaffold, docs, ADRs, CI, Docker Compose. |
| 1a | Server: DB migrations, `auth` (register/login/refresh/logout/me), `users` (profile/metrics, BMR/TDEE/target), pure helpers, rate limiting. |
| 1b | Mobile: AuthStore / ProfileStore / LocaleStore / CoupleStore, secure-store, apiClient with auto-refresh, SignIn/SignUp/ProfileSetup/Home screens, RootNavigator, HE/EN i18n with RTL. |
| 2 | Couples (create/join/leave/me) + Socket.IO gateway (JWT-authed, per-couple rooms, member-joined/left events) + PairScreen + PartnerCard. |
| 3a | Program schema (`program_weeks`, `program_tasks`, `food_lists`, `food_items`), zod-validated seed loader, JSON seed scaffold for the Aba Hatuv v1 13-week program. |

Latest total: **258 tests**; every workspace above the 80% gate.

- `packages/shared`: 42 tests, 100 / 100 / 100 / 100.
- `apps/server`: 105 tests, 96.71 / 85.14 / 97.54 / 99.23.
- `apps/mobile`: 111 tests, 95.48 / 94.54 / 89.43 / 97.25.

## Non-negotiable ground rules (from CLAUDE.md)

1. **TDD.** Failing test first, then implementation. Never lower the 80%
   coverage gate.
2. **Security by default.** Zod-validate every input; parameterized SQL
   only (Kysely); rate-limit auth + write routes; every couple-scoped
   route uses the couple-scope middleware; JWT verified on every request;
   never log PII at info level.
3. **Modularity.** Components and helpers under ~200 lines. Extract pure
   logic into `lib/` and unit-test in isolation.
4. **Bilingual first.** No raw Hebrew/English literals in components —
   every user-visible string goes through i18n keys with parity between
   `he/` and `en/` bundles. RTL must look correct.
5. **Docs co-evolve.** Any cross-cutting change updates `README.md`,
   `CLAUDE.md`, and the relevant `docs/features/*.md`. New architectural
   decisions go in a numbered ADR under `docs/decisions/`.
6. **Self-review the diff** with `git diff` before every commit — look for
   reuse, missing tests, secrets, dead code.
7. **Only touch the shared branch** (`claude/project-planning-Ho70i`).
   Each phase lands as one cohesive commit → PR → merge into `main`.

## What NOT to do

- No `any` or `@ts-ignore` without an ADR.
- No hand-built SQL strings — use Kysely's typed builder.
- No exchange-style diet math — see ADR 0007. Aba Hatuv is a 13-week
  behavioral program, not calorie tiers.
- No third-party navigation library yet. The current `RootNavigator.tsx`
  is intentionally state-driven; introduce `@react-navigation` only when
  tabs land in Phase 4.
- Don't skip the coverage gate; fix the test, not the threshold.
- Don't commit secrets. Use `.env.example` (committed) + `.env`
  (gitignored) + platform secrets in prod.

## What's next: Phase 3b (program engine + REST + mobile)

The Aba Hatuv seed data is already in the DB after
`pnpm --filter @fitnessapp/server migrate && pnpm --filter @fitnessapp/server seed`.
Build the runtime around it.

### Server (Phase 3b)

1. New migration `0004_program_start.sql` — add
   `program_started_on DATE NULL` to `user_metrics`.
2. New module `apps/server/src/modules/program/`:
   - Repo reads `program_weeks`, `program_tasks`, `food_lists`,
     `food_items`.
   - Service:
     - `getCurrentWeek(userId)` → computes the current week from
       `program_started_on` (falls back to week 1 if null); returns the
       week row + its tasks.
     - `getFoodLists(userId, weekNumber?)` → global lists + any
       week-scoped lists matching the current week.
   - REST routes at `/api/v1/program/me/current` and
     `/api/v1/program/lists`.
3. Shared zod DTOs in `packages/shared/src/schemas/program.ts` — import on
   both ends.
4. Integration tests via Supertest against the real seeded DB.

### Mobile (Phase 3b)

1. Shared DTOs → mobile `stores/ProgramStore.ts` (MobX). Observable
   `currentWeek`, `tasks`, `lists`. Fetch on the auth effect (same pattern
   as ProfileStore / CoupleStore in `RootNavigator.tsx`).
2. Screens under `src/screens/program/`:
   - `TodayScreen` — current week title + mission + task checklist
     (visual only; persisting check state is optional for 3b).
   - `FoodListsScreen` — browseable reference lists, filterable by
     current week vs. global.
3. Wire into `RootNavigator.tsx` as additional state (`showProgram` /
   `showLists`) — same pattern as `showPair`.
4. i18n additions under `apps/mobile/src/i18n/{he,en}/program.json` — the
   existing key-parity test will catch omissions.
5. Screen tests using `@testing-library/react-native`, mirroring
   `__tests__/PairScreen.test.tsx`.

### Open item — Hebrew transcription

The seed JSON files at `apps/server/src/db/seeds/aba-hatuv/v1/weeks/*.json`
are structurally complete but have `null` placeholders for `rationale`,
`notes`, and `tasks` in weeks 2 and 4-13. Weeks 1 and 3 are fully
populated. Source material: PDFs of every week's guide (Hebrew). If the
user uploads them into your Codex session:

```bash
apt-get install -y poppler-utils
pdftotext -layout <file>.pdf <file>.txt
```

Fill in each week JSON with real content, one week per commit. Re-run
`pnpm --filter @fitnessapp/server seed` — it's idempotent and updates
rows in place.

Week 11's PDF was not included in the original upload and is still missing.

## First things to do in Codex

1. Clone, checkout the branch, `pnpm install`.
2. Start Postgres (`pnpm db:up`), then
   `pnpm --filter @fitnessapp/server migrate && pnpm --filter @fitnessapp/server seed`.
   Verify with `psql`: 12 weeks + 7 lists + 39 food items.
3. Run `pnpm typecheck && pnpm test:coverage` — every workspace should
   pass with the numbers above.
4. Read the ADRs and feature docs in the order listed at the top.
5. Ask the user which they want first:
   - fill in the remaining Hebrew paragraphs in the seed JSONs, or
   - go directly to Phase 3b engine + screens.
6. When starting Phase 3b, write failing tests first (TDD), implement,
   update `docs/features/diet-planner.md`, then commit with a clear
   message.

## Verification before every commit

- `pnpm typecheck` — clean.
- `pnpm test:coverage` — every workspace passes with ≥ 80% on all four
  metrics.
- `git diff --cached` — no secrets, no `any`, no missing tests, no raw
  literals in JSX, no obsolete comments.
- If you changed anything cross-cutting: update `README.md`, `CLAUDE.md`,
  and the relevant `docs/features/*.md`.

## Push + PR workflow

- Commit locally.
- `git push -u origin claude/project-planning-Ho70i`.
- If the user asks for a PR, create it against `main`; use the PR body to
  summarize what changed and what's covered by tests.

═══════════════════════════════════════════════════════════════
