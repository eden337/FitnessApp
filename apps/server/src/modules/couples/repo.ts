import type { DbClient } from '../../db/client.js';

export type CoupleRow = {
  id: string;
  inviteCode: string;
  createdAt: Date;
};

export type CoupleMemberRow = {
  coupleId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: Date;
};

export const createCouplesRepo = (db: DbClient) => ({
  async findCoupleByInviteCode(code: string): Promise<CoupleRow | null> {
    const row = await db
      .selectFrom('couples')
      .selectAll()
      .where('invite_code', '=', code)
      .executeTakeFirst();
    return row ? mapCouple(row) : null;
  },

  async findCoupleByUserId(userId: string): Promise<CoupleRow | null> {
    const row = await db
      .selectFrom('couples')
      .innerJoin('couple_members', 'couple_members.couple_id', 'couples.id')
      .where('couple_members.user_id', '=', userId)
      .select(['couples.id', 'couples.invite_code', 'couples.created_at'])
      .executeTakeFirst();
    return row ? mapCouple(row) : null;
  },

  async findCoupleById(id: string): Promise<CoupleRow | null> {
    const row = await db
      .selectFrom('couples')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapCouple(row) : null;
  },

  async listMembers(coupleId: string): Promise<CoupleMemberRow[]> {
    const rows = await db
      .selectFrom('couple_members')
      .selectAll()
      .where('couple_id', '=', coupleId)
      .orderBy('joined_at', 'asc')
      .execute();
    return rows.map(mapMember);
  },

  async insertCouple(args: { inviteCode: string; ownerId: string }): Promise<CoupleRow> {
    return db.transaction().execute(async (trx) => {
      const couple = await trx
        .insertInto('couples')
        .values({ invite_code: args.inviteCode })
        .returningAll()
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('couple_members')
        .values({ couple_id: couple.id, user_id: args.ownerId, role: 'owner' })
        .execute();
      return mapCouple(couple);
    });
  },

  /** Returns true if the user was added; false if already a member. */
  async addMember(args: { coupleId: string; userId: string }): Promise<boolean> {
    const existing = await db
      .selectFrom('couple_members')
      .select('user_id')
      .where('user_id', '=', args.userId)
      .executeTakeFirst();
    if (existing) return false;
    await db
      .insertInto('couple_members')
      .values({ couple_id: args.coupleId, user_id: args.userId, role: 'member' })
      .execute();
    return true;
  },

  /** Returns the number of remaining members after the removal. */
  async removeMember(args: { coupleId: string; userId: string }): Promise<number> {
    return db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('couple_members')
        .where('couple_id', '=', args.coupleId)
        .where('user_id', '=', args.userId)
        .execute();
      const rows = await trx
        .selectFrom('couple_members')
        .select((eb) => eb.fn.countAll<string>().as('count'))
        .where('couple_id', '=', args.coupleId)
        .executeTakeFirstOrThrow();
      const remaining = Number(rows.count);
      if (remaining === 0) {
        await trx.deleteFrom('couples').where('id', '=', args.coupleId).execute();
      }
      return remaining;
    });
  },
});

export type CouplesRepo = ReturnType<typeof createCouplesRepo>;

const mapCouple = (row: { id: string; invite_code: string; created_at: Date }): CoupleRow => ({
  id: row.id,
  inviteCode: row.invite_code,
  createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
});

const mapMember = (row: {
  couple_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: Date;
}): CoupleMemberRow => ({
  coupleId: row.couple_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.joined_at instanceof Date ? row.joined_at : new Date(row.joined_at),
});
