# Internationalization & RTL

## Languages

- **Hebrew (`he`)** — default. The Aba Hatuv source material is Hebrew.
- **English (`en`)** — full parity.

## Library

- `react-i18next` with per-feature namespaces (`auth`, `profile`, `couple`,
  `diet`, `progress`, `common`).
- Resources live under `apps/mobile/src/i18n/<locale>/<namespace>.json`.
- Locale preference persisted in `expo-secure-store`; default derived from
  device locale, falling back to `he`.

## RTL

- React Native's `I18nManager.forceRTL(locale === 'he')` toggles on locale
  change. The app restarts (`Updates.reloadAsync`) so the layout direction
  is applied cleanly.
- All padding/margin uses `Start` / `End` (logical) rather than `Left` /
  `Right` — handled by a small `spacing` helper in `theme/spacing.ts`.
- Icons that imply direction (e.g. back arrow, progress chevron) are mirrored
  automatically via `I18nManager.isRTL`; one-off exceptions (brand logos) are
  explicitly opted out.

## Formatting

- Dates: `dayjs` with `he` + `en` locales; relative time via `dayjs/plugin/relativeTime`.
- Numbers: `Intl.NumberFormat` with the active locale.
- Weights/heights: metric only (kg, cm).

## Translation hygiene

- No raw strings in components. Every user-visible text uses `t('namespace:key')`.
- Keys are English-like and describe intent, not content: `t('diet:mealType.breakfast')`.
- Pluralization via i18next's `count` and ICU rules (Hebrew has special plural cases).
- A lint rule (`i18next/no-literal-string`) prevents regressions on
  `.tsx` files under `src/screens` and `src/components`.

## Testing

- Snapshot each screen in both locales.
- A coverage test asserts that every key in `he/*.json` also exists in
  `en/*.json` (and vice-versa) so no locale falls behind.
