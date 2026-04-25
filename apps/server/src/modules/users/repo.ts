import type { DbClient } from '../../db/client.js';
import type { UpdateMetricsInput, UpdateProfileInput, UserMetrics } from '@fitnessapp/shared';

export const createUsersRepo = (db: DbClient) => ({
  async getMetrics(userId: string): Promise<UserMetrics | null> {
    const row = await db
      .selectFrom('user_metrics')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();
    if (!row) return null;
    return {
      currentWeightKg: Number(row.current_weight_kg),
      activityLevel: row.activity_level,
      goalType: row.goal_type,
      goalWeightKg: row.goal_weight_kg === null ? null : Number(row.goal_weight_kg),
      dietaryRestrictions: (row.dietary_restrictions as UserMetrics['dietaryRestrictions']) ?? {},
    };
  },

  async upsertMetrics(userId: string, input: UserMetrics): Promise<UserMetrics> {
    await db
      .insertInto('user_metrics')
      .values({
        user_id: userId,
        current_weight_kg: input.currentWeightKg,
        activity_level: input.activityLevel,
        goal_type: input.goalType,
        goal_weight_kg: input.goalWeightKg,
        dietary_restrictions: input.dietaryRestrictions as unknown,
      })
      .onConflict((oc) =>
        oc.column('user_id').doUpdateSet({
          current_weight_kg: input.currentWeightKg,
          activity_level: input.activityLevel,
          goal_type: input.goalType,
          goal_weight_kg: input.goalWeightKg,
          dietary_restrictions: input.dietaryRestrictions as unknown,
        }),
      )
      .execute();
    return input;
  },

  async updateProfile(userId: string, patch: UpdateProfileInput): Promise<void> {
    if (Object.keys(patch).length === 0) return;
    const update: Record<string, unknown> = {};
    if (patch.displayName !== undefined) update.display_name = patch.displayName;
    if (patch.locale !== undefined) update.locale = patch.locale;
    if (patch.gender !== undefined) update.gender = patch.gender;
    if (patch.birthDate !== undefined) update.birth_date = patch.birthDate;
    if (patch.heightCm !== undefined) update.height_cm = patch.heightCm;
    await db.updateTable('users').set(update).where('id', '=', userId).execute();
  },

  async updateMetrics(userId: string, patch: UpdateMetricsInput): Promise<void> {
    if (Object.keys(patch).length === 0) return;
    const update: Record<string, unknown> = {};
    if (patch.currentWeightKg !== undefined) update.current_weight_kg = patch.currentWeightKg;
    if (patch.activityLevel !== undefined) update.activity_level = patch.activityLevel;
    if (patch.goalType !== undefined) update.goal_type = patch.goalType;
    if (patch.goalWeightKg !== undefined) update.goal_weight_kg = patch.goalWeightKg;
    if (patch.dietaryRestrictions !== undefined) {
      update.dietary_restrictions = patch.dietaryRestrictions as unknown;
    }
    await db.updateTable('user_metrics').set(update).where('user_id', '=', userId).execute();
  },
});

export type UsersRepo = ReturnType<typeof createUsersRepo>;
