import type {
  CreateSharedActivityInput,
  SharedActivity,
  SharedActivityFeedQuery,
} from '@fitnessapp/shared';
import type { DbClient } from '../../db/client.js';

const mapActivity = (row: {
  id: string;
  couple_id: string;
  actor_user_id: string;
  display_name: string;
  kind: SharedActivity['kind'];
  note: string | null;
  created_at: Date;
}): SharedActivity => ({
  id: row.id,
  coupleId: row.couple_id,
  actor: {
    userId: row.actor_user_id,
    displayName: row.display_name,
  },
  kind: row.kind,
  note: row.note,
  createdAt: row.created_at.toISOString(),
});

export const createActivitiesRepo = (db: DbClient) => ({
  async create(
    actorUserId: string,
    input: CreateSharedActivityInput,
  ): Promise<SharedActivity | null> {
    return db.transaction().execute(async (transaction) => {
      const membership = await transaction
        .selectFrom('couple_members')
        .select('couple_id')
        .where('user_id', '=', actorUserId)
        .forUpdate()
        .executeTakeFirst();
      if (!membership) return null;
      const inserted = await transaction
        .insertInto('shared_activities')
        .values({
          couple_id: membership.couple_id,
          actor_user_id: actorUserId,
          kind: input.kind,
          note: input.note ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const actor = await transaction
        .selectFrom('users')
        .select('display_name')
        .where('id', '=', actorUserId)
        .executeTakeFirstOrThrow();
      return mapActivity({ ...inserted, display_name: actor.display_name });
    });
  },

  async listForUser(
    userId: string,
    query: SharedActivityFeedQuery,
  ): Promise<SharedActivity[] | null> {
    return db.transaction().execute(async (transaction) => {
      const membership = await transaction
        .selectFrom('couple_members')
        .select('couple_id')
        .where('user_id', '=', userId)
        .forShare()
        .executeTakeFirst();
      if (!membership) return null;
      let selection = transaction
        .selectFrom('shared_activities')
        .innerJoin('users', 'users.id', 'shared_activities.actor_user_id')
        .select([
          'shared_activities.id',
          'shared_activities.couple_id',
          'shared_activities.actor_user_id',
          'shared_activities.kind',
          'shared_activities.note',
          'shared_activities.created_at',
          'users.display_name',
        ])
        .where('shared_activities.couple_id', '=', membership.couple_id);
      if (query.since) {
        // Inclusive by design: PostgreSQL retains sub-millisecond precision that
        // JSON timestamps cannot represent. Clients deduplicate the boundary ID.
        selection = selection.where(
          'shared_activities.created_at',
          '>=',
          new Date(query.since),
        );
      }
      const rows = await selection
        .orderBy('shared_activities.created_at', query.since ? 'asc' : 'desc')
        .orderBy('shared_activities.id', query.since ? 'asc' : 'desc')
        .limit(query.limit)
        .execute();
      return rows.map(mapActivity);
    });
  },
});

export type ActivitiesRepo = ReturnType<typeof createActivitiesRepo>;
