import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { DbClient } from './client.js';
import {
  type FoodListSeed,
  type ProgramWeekSeed,
  type SeedBundle,
  SeedBundleSchema,
  ProgramWeekSeedSchema,
  FoodListSeedSchema,
} from './seeds/aba-hatuv/schema.js';

/**
 * Default seeds directory, resolved relative to the package root so it's
 * stable whether we're running compiled `dist/` code, `tsx`, or jest. We
 * avoid `import.meta.url` here because ts-jest's CJS transform doesn't
 * permit it; production code reaches the same path through `process.cwd()`
 * since the server is always launched from `apps/server`.
 */
export const ABA_HATUV_ROOT = resolve(process.cwd(), 'src', 'db', 'seeds', 'aba-hatuv');

const readJson = async <T>(path: string): Promise<T> => {
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as T;
};

/**
 * Read every seed file under `<root>/<version>/` into a single typed bundle.
 * Layout:
 *   <root>/<version>/program.json
 *   <root>/<version>/weeks/<NN>.json     (one file per week, ordered by name)
 *   <root>/<version>/food-lists/*.json   (one file per list)
 *
 * Validation runs at every step so a broken seed file fails the migration
 * step in CI rather than corrupting production state.
 */
export const readSeedBundle = async (
  version: string,
  root: string = ABA_HATUV_ROOT,
): Promise<SeedBundle> => {
  const versionDir = join(root, version);
  const program = await readJson<unknown>(join(versionDir, 'program.json'));

  const weeksDir = join(versionDir, 'weeks');
  const weekFiles = (await readdir(weeksDir)).filter((f) => f.endsWith('.json')).sort();
  const weeks: ProgramWeekSeed[] = [];
  for (const name of weekFiles) {
    const data = await readJson<unknown>(join(weeksDir, name));
    weeks.push(ProgramWeekSeedSchema.parse(data));
  }

  const listsDir = join(versionDir, 'food-lists');
  const listFiles = (await readdir(listsDir)).filter((f) => f.endsWith('.json')).sort();
  const lists: FoodListSeed[] = [];
  for (const name of listFiles) {
    const data = await readJson<unknown>(join(listsDir, name));
    lists.push(FoodListSeedSchema.parse(data));
  }

  return SeedBundleSchema.parse({ program, weeks, lists });
};

/**
 * Idempotent upsert. Reusing `program_version` + (week_number / list slug)
 * as natural keys means rerunning the seed is a no-op when the JSON hasn't
 * changed, and a content-only update when it has.
 *
 * Tasks and items are replaced wholesale per parent — they're a small,
 * authored payload, and individual ordinals don't carry user references.
 */
export const applySeedBundle = async (db: DbClient, bundle: SeedBundle): Promise<void> => {
  const version = bundle.program.version;
  await db.transaction().execute(async (trx) => {
    const weekIdBySlug = new Map<string, string>();

    for (const w of bundle.weeks) {
      const inserted = await trx
        .insertInto('program_weeks')
        .values({
          program_version: version,
          week_number: w.weekNumber,
          slug: w.slug,
          title_he: w.title.he,
          title_en: w.title.en,
          mission_he: w.mission.he,
          mission_en: w.mission.en,
          rationale_he: w.rationale?.he ?? null,
          rationale_en: w.rationale?.en ?? null,
          notes_he: w.notes?.he ?? null,
          notes_en: w.notes?.en ?? null,
        })
        .onConflict((oc) =>
          oc.columns(['program_version', 'week_number']).doUpdateSet({
            slug: w.slug,
            title_he: w.title.he,
            title_en: w.title.en,
            mission_he: w.mission.he,
            mission_en: w.mission.en,
            rationale_he: w.rationale?.he ?? null,
            rationale_en: w.rationale?.en ?? null,
            notes_he: w.notes?.he ?? null,
            notes_en: w.notes?.en ?? null,
          }),
        )
        .returning(['id', 'slug'])
        .executeTakeFirstOrThrow();
      weekIdBySlug.set(inserted.slug, inserted.id);

      // Replace tasks wholesale — small payload, no foreign references.
      await trx.deleteFrom('program_tasks').where('week_id', '=', inserted.id).execute();
      if (w.tasks.length > 0) {
        await trx
          .insertInto('program_tasks')
          .values(
            w.tasks.map((t, i) => ({
              week_id: inserted.id,
              ordinal: i,
              kind: t.kind,
              title_he: t.title.he,
              title_en: t.title.en,
              description_he: t.description?.he ?? null,
              description_en: t.description?.en ?? null,
            })),
          )
          .execute();
      }
    }

    for (const list of bundle.lists) {
      const weekId = list.weekSlug ? (weekIdBySlug.get(list.weekSlug) ?? null) : null;

      // Find-or-create by (version, slug, week_id) — partial unique indexes
      // mean we can't rely on a single ON CONFLICT, so do an explicit lookup.
      let existing = await trx
        .selectFrom('food_lists')
        .select('id')
        .where('program_version', '=', version)
        .where('slug', '=', list.slug)
        .where((eb) => (weekId ? eb('week_id', '=', weekId) : eb('week_id', 'is', null)))
        .executeTakeFirst();

      if (existing) {
        await trx
          .updateTable('food_lists')
          .set({
            name_he: list.name.he,
            name_en: list.name.en,
            description_he: list.description?.he ?? null,
            description_en: list.description?.en ?? null,
          })
          .where('id', '=', existing.id)
          .execute();
      } else {
        existing = await trx
          .insertInto('food_lists')
          .values({
            program_version: version,
            slug: list.slug,
            name_he: list.name.he,
            name_en: list.name.en,
            description_he: list.description?.he ?? null,
            description_en: list.description?.en ?? null,
            week_id: weekId,
          })
          .returning('id')
          .executeTakeFirstOrThrow();
      }

      // Replace items wholesale per list.
      await trx.deleteFrom('food_items').where('list_id', '=', existing.id).execute();
      if (list.items.length > 0) {
        await trx
          .insertInto('food_items')
          .values(
            list.items.map((it, i) => ({
              list_id: existing!.id,
              ordinal: i,
              visual_key: it.visualKey,
              name_he: it.name.he,
              name_en: it.name.en,
              portion_he: it.portion?.he ?? null,
              portion_en: it.portion?.en ?? null,
              notes_he: it.notes?.he ?? null,
              notes_en: it.notes?.en ?? null,
            })),
          )
          .execute();
      }
    }
  });
};
