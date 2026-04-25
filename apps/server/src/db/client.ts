import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

export type DbClient = Kysely<Database>;

/**
 * Build a Kysely client over a pg connection pool. Centralized so the rest
 * of the app never reaches for `pg` directly and so tests can construct
 * isolated pools per database URL.
 */
export const createDbClient = (databaseUrl: string): DbClient => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
};
