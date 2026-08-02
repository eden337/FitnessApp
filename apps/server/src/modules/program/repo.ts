import {
  FoodVisualKeySchema,
  type FoodList,
  type FoodItem,
  type ProgramTask,
  type ProgramWeek,
} from '@fitnessapp/shared';
import type { DbClient } from '../../db/client.js';
import { serializeDateOnly } from '../../lib/israel-date.js';

const bilingual = (he: string, en: string) => ({ he, en });
const optionalBilingual = (he: string | null, en: string | null) =>
  he && en ? bilingual(he, en) : null;

export const createProgramRepo = (db: DbClient) => ({
  async getStartedOn(userId: string): Promise<string | null> {
    const row = await db
      .selectFrom('user_metrics')
      .select('program_started_on')
      .where('user_id', '=', userId)
      .executeTakeFirst();
    if (!row?.program_started_on) return null;
    return serializeDateOnly(row.program_started_on);
  },

  async setStartedOnIfNull(
    userId: string,
    startedOn: string,
  ): Promise<'started' | 'already_started' | 'missing_metrics'> {
    const updated = await db
      .updateTable('user_metrics')
      .set({ program_started_on: startedOn })
      .where('user_id', '=', userId)
      .where('program_started_on', 'is', null)
      .returning('user_id')
      .executeTakeFirst();
    if (updated) return 'started';

    const existing = await db
      .selectFrom('user_metrics')
      .select('program_started_on')
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return existing ? 'already_started' : 'missing_metrics';
  },

  async getWeekWithTasks(version: string, weekNumber: number): Promise<ProgramWeek | null> {
    const row = await db
      .selectFrom('program_weeks')
      .selectAll()
      .where('program_version', '=', version)
      .where('week_number', '=', weekNumber)
      .executeTakeFirst();
    if (!row) return null;

    const taskRows = await db
      .selectFrom('program_tasks')
      .selectAll()
      .where('week_id', '=', row.id)
      .orderBy('ordinal')
      .execute();
    const tasks: ProgramTask[] = taskRows.map((task) => ({
      id: task.id,
      ordinal: task.ordinal,
      kind: task.kind,
      title: bilingual(task.title_he, task.title_en),
      description: optionalBilingual(task.description_he, task.description_en),
    }));
    return {
      id: row.id,
      weekNumber: row.week_number,
      slug: row.slug,
      title: bilingual(row.title_he, row.title_en),
      mission: bilingual(row.mission_he, row.mission_en),
      rationale: optionalBilingual(row.rationale_he, row.rationale_en),
      notes: optionalBilingual(row.notes_he, row.notes_en),
      tasks,
    };
  },

  async getFoodLists(version: string, weekNumber: number): Promise<FoodList[]> {
    const rows = await db
      .selectFrom('food_lists')
      .leftJoin('program_weeks', 'program_weeks.id', 'food_lists.week_id')
      .select([
        'food_lists.id',
        'food_lists.slug',
        'food_lists.name_he',
        'food_lists.name_en',
        'food_lists.description_he',
        'food_lists.description_en',
        'program_weeks.week_number',
      ])
      .where('food_lists.program_version', '=', version)
      .where((eb) =>
        eb.or([
          eb('food_lists.week_id', 'is', null),
          eb('program_weeks.week_number', '=', weekNumber),
        ]),
      )
      .orderBy('food_lists.slug')
      .execute();

    const listIds = rows.map((row) => row.id);
    const itemRows =
      listIds.length === 0
        ? []
        : await db
            .selectFrom('food_items')
            .selectAll()
            .where('list_id', 'in', listIds)
            .orderBy('list_id')
            .orderBy('ordinal')
            .execute();
    const itemsByList = new Map<string, FoodItem[]>();
    for (const item of itemRows) {
      const mapped: FoodItem = {
        id: item.id,
        ordinal: item.ordinal,
        visualKey: FoodVisualKeySchema.parse(item.visual_key),
        name: bilingual(item.name_he, item.name_en),
        portion: optionalBilingual(item.portion_he, item.portion_en),
        notes: optionalBilingual(item.notes_he, item.notes_en),
      };
      const items = itemsByList.get(item.list_id) ?? [];
      items.push(mapped);
      itemsByList.set(item.list_id, items);
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: bilingual(row.name_he, row.name_en),
      description: optionalBilingual(row.description_he, row.description_en),
      weekNumber: row.week_number,
      items: itemsByList.get(row.id) ?? [],
    }));
  },
});

export type ProgramRepo = ReturnType<typeof createProgramRepo>;
