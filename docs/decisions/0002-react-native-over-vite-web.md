# ADR 0002 — React Native (Expo) instead of Vite web

**Status:** accepted · **Date:** 2026-04-24

## Context

The initial brief said "React + TypeScript + Vite". A follow-up clarification
confirmed the target is a **mobile application** — iOS + Android — used daily
by a couple at home and on the go. Vite is a web bundler; it can build a PWA
but cannot produce native iOS/Android binaries. React Native (Expo) gives us
a true native experience while keeping the TypeScript + MobX programming
model the brief asked for.

## Decision

Use **React Native with Expo** (managed workflow) for the mobile client.
Keep TypeScript + MobX + react-i18next as requested. Drop Vite.

## Consequences

- **Pros:** native feel (haptics, push notifications later, home-screen
  install), offline support, single codebase for iOS + Android, Expo
  handles build pipelines.
- **Cons:** slightly different tooling from web React (Metro bundler, no DOM
  APIs); some web-only libraries are unavailable. MobX + react-i18next are
  fully supported.
- **Testing:** Jest + `@testing-library/react-native` instead of
  `@testing-library/react`.

## Alternatives considered

- **Vite + Capacitor wrapper:** keep Vite, wrap into native shells. Worse
  native feel; two layers of indirection.
- **Pure PWA:** no install to app stores, no push notifications, iOS limits.
