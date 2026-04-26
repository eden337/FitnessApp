import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../config/env.js';
import { createDbClient } from './client.js';
import { applySeedBundle, readSeedBundle } from './seedLoader.js';

/**
 * Seed runner: reads the on-disk Aba Hatuv v1 bundle, validates it, and
 * upserts. Idempotent — rerun whenever the JSON files change.
 */
export const run = async (): Promise<void> => {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error('[seed] DATABASE_URL is required');
    process.exit(1);
  }
  const db = createDbClient(env.DATABASE_URL);
  try {
    const bundle = await readSeedBundle('v1');
    await applySeedBundle(db, bundle);
    console.log(
      `[seed] applied program ${bundle.program.version}: ${bundle.weeks.length} weeks, ${bundle.lists.length} lists.`,
    );
  } finally {
    await db.destroy();
  }
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  run().catch((err: unknown) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
}
