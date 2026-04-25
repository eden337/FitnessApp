# CLAUDE.md — shared package

Source of truth for types / zod schemas used by both the server and the
mobile client. Importing the same schema on both ends means a validation
rule written once protects both tiers.

## Layout

```
src/
  schemas/
    common.ts     # enums (locale, gender, activity, goal) + uuid alias
    auth.ts       # register/login inputs, token shapes
    <feature>.ts  # added per feature as it lands
  events/         # Socket.IO event schemas (Phase 2+)
  dto/            # response DTOs (Phase 1+)
  index.ts        # barrel re-exports
```

## Conventions

- Only pure TypeScript + zod — no runtime dependencies beyond zod.
- Every schema has a matching `export type X = z.infer<typeof XSchema>`.
- Use `.strict()` on object inputs to reject unknown fields (defense in depth).
- Split large features into their own file; do not grow any module past ~150 LOC.
- Every schema ships with unit tests proving both happy and invalid paths.

## Scripts

```bash
pnpm --filter @fitnessapp/shared test
pnpm --filter @fitnessapp/shared test:coverage
pnpm --filter @fitnessapp/shared typecheck
```
