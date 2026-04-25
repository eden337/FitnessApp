import type { DbClient } from '../../db/client.js';

export type NewUser = {
  email: string;
  passwordHash: string;
  displayName: string;
  locale: 'he' | 'en';
  gender: 'female' | 'male' | 'other';
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
};

export type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  locale: 'he' | 'en';
  gender: 'female' | 'male' | 'other';
  birthDate: string;
  heightCm: number;
};

/**
 * Repository for the user + refresh-token tables. Pure data access — every
 * business rule lives in the service layer.
 */
export const createAuthRepo = (db: DbClient) => ({
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
    return row ? mapUser(row) : null;
  },

  async findUserById(id: string): Promise<UserRow | null> {
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapUser(row) : null;
  },

  async insertUser(input: NewUser): Promise<UserRow> {
    const row = await db
      .insertInto('users')
      .values({
        email: input.email,
        password_hash: input.passwordHash,
        display_name: input.displayName,
        locale: input.locale,
        gender: input.gender,
        birth_date: input.birthDate,
        height_cm: input.heightCm,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapUser(row);
  },

  async insertRefreshToken(args: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    const row = await db
      .insertInto('refresh_tokens')
      .values({
        user_id: args.userId,
        token_hash: args.tokenHash,
        expires_at: args.expiresAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return { id: row.id };
  },

  async findActiveRefreshToken(tokenHash: string): Promise<{ id: string; userId: string } | null> {
    const row = await db
      .selectFrom('refresh_tokens')
      .select(['id', 'user_id', 'expires_at', 'revoked_at'])
      .where('token_hash', '=', tokenHash)
      .executeTakeFirst();
    if (!row) return null;
    if (row.revoked_at !== null) return null;
    if (new Date(row.expires_at as unknown as string).getTime() <= Date.now()) return null;
    return { id: row.id, userId: row.user_id };
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('id', '=', id)
      .where('revoked_at', 'is', null)
      .execute();
  },
});

export type AuthRepo = ReturnType<typeof createAuthRepo>;

const mapUser = (row: {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  locale: 'he' | 'en';
  gender: 'female' | 'male' | 'other';
  birth_date: Date | string;
  height_cm: number;
}): UserRow => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  displayName: row.display_name,
  locale: row.locale,
  gender: row.gender,
  birthDate:
    row.birth_date instanceof Date
      ? row.birth_date.toISOString().slice(0, 10)
      : String(row.birth_date).slice(0, 10),
  heightCm: row.height_cm,
});
