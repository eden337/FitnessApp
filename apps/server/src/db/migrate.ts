/**
 * Migration runner entry point. Intentionally empty in Phase 0 — populated in
 * Phase 1 when the first migration (auth + profile) lands. Kept as a concrete
 * file so `pnpm --filter @fitnessapp/server migrate` works end-to-end once
 * migrations exist.
 */
export const run = async (): Promise<void> => {
  console.log('[migrate] no migrations yet (Phase 0 scaffolding).');
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
