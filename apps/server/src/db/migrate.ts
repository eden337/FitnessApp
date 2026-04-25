import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from '../config/env.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, 'migrations');

/**
 * Tiny migration runner: applies every `*.sql` file under `migrations/` in
 * alphabetical order, idempotently. Tracks applied filenames in
 * `_migrations` so a second run is a no-op. Each file is executed in its
 * own transaction so a partial failure leaves the prior migrations intact.
 *
 * Migrations are intentionally simple (raw SQL) — Kysely's typed builder is
 * for runtime queries; migrations are reviewed by humans and don't benefit
 * from type-checking.
 */
export const migrate = async (databaseUrl: string): Promise<string[]> => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const applied: string[] = [];
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const { rows } = await pool.query<{ filename: string }>(
        'SELECT filename FROM _migrations WHERE filename = $1',
        [filename],
      );
      if (rows.length > 0) continue;

      const sql = await readFile(join(MIGRATIONS_DIR, filename), 'utf-8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        applied.push(filename);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
  return applied;
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error('[migrate] DATABASE_URL is required');
    process.exit(1);
  }
  migrate(env.DATABASE_URL)
    .then((applied) => {
      if (applied.length === 0) {
        console.log('[migrate] no pending migrations');
      } else {
        console.log(`[migrate] applied: ${applied.join(', ')}`);
      }
    })
    .catch((err: unknown) => {
      console.error('[migrate] failed:', err);
      process.exit(1);
    });
}
