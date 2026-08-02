import type { WeightHistoryQuery, WeightLog } from '@fitnessapp/shared';
import type { DbClient } from '../../db/client.js';
import { serializeDateOnly } from '../../lib/israel-date.js';

type WeightWrite = {
  loggedOn: string;
  weightKg: number;
  bodyFatPct: number | null;
  notes: string | null;
};

const timestamp = (value: Date): string => value.toISOString();

const mapWeightLog = (row: {
  id: string;
  logged_on: Date | string;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}): WeightLog => ({
  id: row.id,
  loggedOn: serializeDateOnly(row.logged_on),
  weightKg: Number(row.weight_kg),
  bodyFatPct: row.body_fat_pct === null ? null : Number(row.body_fat_pct),
  notes: row.notes,
  createdAt: timestamp(row.created_at),
  updatedAt: timestamp(row.updated_at),
});

export const createProgressRepo = (db: DbClient) => ({
  async getProgramStartedOn(userId: string): Promise<string | null> {
    const row = await db
      .selectFrom('user_metrics')
      .select('program_started_on')
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row?.program_started_on ? serializeDateOnly(row.program_started_on) : null;
  },

  async upsertWeightLog(userId: string, input: WeightWrite): Promise<WeightLog | null> {
    return db.transaction().execute(async (trx) => {
      const metrics = await trx
        .selectFrom('user_metrics')
        .select('user_id')
        .where('user_id', '=', userId)
        .executeTakeFirst();
      if (!metrics) return null;

      const row = await trx
        .insertInto('weight_logs')
        .values({
          user_id: userId,
          logged_on: input.loggedOn,
          weight_kg: input.weightKg,
          body_fat_pct: input.bodyFatPct,
          notes: input.notes,
        })
        .onConflict((conflict) =>
          conflict.columns(['user_id', 'logged_on']).doUpdateSet({
            weight_kg: input.weightKg,
            body_fat_pct: input.bodyFatPct,
            notes: input.notes,
          }),
        )
        .returningAll()
        .executeTakeFirstOrThrow();

      const latest = await trx
        .selectFrom('weight_logs')
        .select('weight_kg')
        .where('user_id', '=', userId)
        .orderBy('logged_on', 'desc')
        .orderBy('updated_at', 'desc')
        .executeTakeFirstOrThrow();
      await trx
        .updateTable('user_metrics')
        .set({ current_weight_kg: Number(latest.weight_kg) })
        .where('user_id', '=', userId)
        .execute();

      return mapWeightLog(row);
    });
  },

  async listWeightLogs(userId: string, query: WeightHistoryQuery): Promise<WeightLog[]> {
    let selection = db
      .selectFrom('weight_logs')
      .selectAll()
      .where('user_id', '=', userId);
    if (query.from) selection = selection.where('logged_on', '>=', query.from);
    if (query.to) selection = selection.where('logged_on', '<=', query.to);
    const rows = await selection
      .orderBy('logged_on', 'desc')
      .orderBy('updated_at', 'desc')
      .limit(query.limit)
      .execute();
    return rows.map(mapWeightLog);
  },
});

export type ProgressRepo = ReturnType<typeof createProgressRepo>;
