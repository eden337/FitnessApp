# Couple Fit — כושר לזוגות

> **Product name:** Couple Fit (`כושר לזוגות`)
> **Repository name:** FitnessApp

Couple Fit is a bilingual Hebrew/English wellness companion that helps two
partners build healthier routines together. It turns the 13-week
**אבא חטוב (Aba Hatuv)** foundation program into a friendly daily journey:
clear weekly guidance, illustrated food references, small achievable actions,
shared wins, and timely encouragement from the person doing the journey with
you.

The app is deliberately not a calorie-counting dashboard or a competitive
weight-loss leaderboard. During the 13-week foundation program, weighing and
weight-progress tracking stay out of the experience in accordance with the
program's principles. Private weight trends become available only later, in
maintenance, as a neutral tool for noticing whether habits are slipping.

## The idea

Healthy change is easier to sustain when it feels clear, rewarding, and
socially supported. Couple Fit combines three ideas:

1. **A guided program.** Each week has one understandable mission, practical
   tasks, and relevant food guidance instead of an overwhelming collection of
   measurements.
2. **Progress through accomplishment.** The interface highlights the next
   achievable action and celebrates consistency, hydration, movement, meals,
   vegetables, and encouragement.
3. **A private team of two.** Partners can share a small, intentionally safe
   set of wins in real time. Sensitive information such as weight, BMI, age,
   calories, and body measurements is never placed in the shared feed.

The result should feel less like filling out a health spreadsheet and more
like completing a positive quest with someone who cares about you.

## Who it is for

Couple Fit is designed primarily for:

- couples following the Aba Hatuv program together;
- Hebrew-speaking users who need a first-class RTL experience, with an equal
  English experience for bilingual households;
- busy adults and parents who respond better to clear daily actions than dense
  nutrition analytics;
- partners who want accountability and encouragement without exposing private
  body data or turning wellness into a competition;
- people transitioning from the structured 13-week program into long-term
  maintenance of its principles.

It is a behavioral wellness companion, not a medical device and not a
replacement for individual medical or nutritional advice.

## Inspiration

The product draws from several complementary sources:

- **Aba Hatuv:** the program supplies the 13-week behavioral structure, weekly
  guidance, food categories, recipes, and the rule that weight should not drive
  the foundation phase.
- **Partner accountability:** progress is framed as cooperation—shared wins,
  gentle nudges, and celebration—rather than comparison between partners.
- **Gameful habit design:** missions, momentum, progress rings, streak-like
  consistency, badges, and brief celebrations make useful actions satisfying
  without allowing points to replace the real habit.
- **Modern learning and wellness products:** short lessons, one clear next
  action, visible progress, friendly language, and forgiving recovery after a
  missed day inform the interaction model.
- **Colorful editorial illustration:** recognizable cartoon food artwork and
  warm, expressive surfaces make nutritional reference material inviting and
  easy to scan.

These are design influences, not an attempt to reproduce another product. The
app's defining combination is Aba Hatuv content, bilingual Israeli context,
privacy-safe couple support, and a celebration-first visual language.

## Design direction

The visual character is **playful wellness for two**: warm, optimistic, clear,
and accomplishment-oriented. Everyday screens remain calm and readable; color
and motion become more expressive around missions, partner moments, milestones,
and celebrations.

- Coral communicates action.
- Teal communicates teamwork.
- Violet communicates progress.
- Gold communicates reward.
- Blue communicates hydration.
- Green communicates success.

Light mode uses warm cream surfaces, while dark mode uses layered deep navy.
Food illustrations always retain their saturated natural colors in both
themes. Rubik supports a unified Hebrew/English identity, and every interaction
is designed for RTL, reduced motion, accessible contrast, and meaningful text
labels in addition to color and icons.

The normative visual rules live in
[`docs/design/design.md`](docs/design/design.md).

> Status: **Phase 4d — realtime shared wins**. Aba Hatuv program guidance,
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
