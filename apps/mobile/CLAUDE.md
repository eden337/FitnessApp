# CLAUDE.md — mobile workspace

Expo managed workflow, React Native + TypeScript + MobX + react-i18next.
Phase 0 ships a bilingual home screen and i18n scaffolding; feature screens
arrive in Phases 1–4.

## Layout

```
src/
  app/            # App.tsx, navigation wrappers, providers
  components/     # reusable RTL-aware UI primitives
  screens/        # feature screens (one folder per feature)
  stores/         # MobX stores (AuthStore, ProfileStore, ...)
  services/       # apiClient, socketClient, secure storage
  i18n/           # he/, en/, resources.ts, I18nProvider.tsx
  theme/          # colors, spacing, typography, RTL helpers
  utils/          # pure helpers
__tests__/        # Jest + @testing-library/react-native
```

## Conventions

- Only `@fitnessapp/shared` types/schemas cross the wire — never redefine locally.
- Every string in JSX goes through `t('ns:key')`. New keys are added to **both**
  `he/*.json` and `en/*.json`; the `i18n.test.ts` coverage test enforces parity.
- Components consume tokens from `src/theme`; no raw colors or magic numbers in JSX.
- MobX stores are plain classes with `makeAutoObservable`; prefer `runInAction`
  inside async methods; avoid reactions in components (use `observer`).
- Components are pure, under ~200 lines; extract subcomponents and hooks early.

## Scripts

```bash
pnpm --filter @fitnessapp/mobile start
pnpm --filter @fitnessapp/mobile test
pnpm --filter @fitnessapp/mobile test:coverage
pnpm --filter @fitnessapp/mobile typecheck
```

## Adding a screen

1. Create `src/screens/<feature>/<Screen>.tsx` (thin view, reads from a store).
2. Add or reuse a MobX store under `src/stores/` and wire it with `observer`.
3. Add `he` + `en` keys under the feature namespace.
4. Add a test in `__tests__/<feature>.test.tsx` that renders and exercises it.
5. Update `docs/features/<feature>.md`.
