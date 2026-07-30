import { sql } from 'kysely';
import { applySeedBundle, readSeedBundle } from '../src/db/seedLoader.js';
import { closeTestDb, getTestDb } from './helpers/test-app.js';

const truncateProgram = async (): Promise<void> => {
  const db = getTestDb();
  await sql`TRUNCATE TABLE food_items, food_lists, program_tasks, program_weeks RESTART IDENTITY CASCADE`.execute(
    db,
  );
};

describe('seedLoader (against real Postgres)', () => {
  afterAll(async () => {
    await closeTestDb();
  });
  beforeEach(async () => {
    await truncateProgram();
  });

  it('reads + validates the on-disk v1 bundle', async () => {
    const bundle = await readSeedBundle('v1');
    expect(bundle.program.version).toBe('v1');
    expect(bundle.weeks.length).toBe(12);
    expect(bundle.lists.length).toBe(7);
    // Sanity: every week has a unique slug.
    const slugs = bundle.weeks.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    // The cleanse-vacation list is the only week-scoped one.
    const scoped = bundle.lists.filter((l) => l.weekSlug !== null);
    expect(scoped.map((l) => l.weekSlug)).toEqual(['leptin-cleanse']);
  });

  it('applies the bundle: 12 weeks, 7 lists, items present', async () => {
    const db = getTestDb();
    const bundle = await readSeedBundle('v1');
    await applySeedBundle(db, bundle);

    const weekRow = await db
      .selectFrom('program_weeks')
      .select((eb) => eb.fn.countAll<string>().as('n'))
      .executeTakeFirstOrThrow();
    expect(Number(weekRow.n)).toBe(12);

    const listRow = await db
      .selectFrom('food_lists')
      .select((eb) => eb.fn.countAll<string>().as('n'))
      .executeTakeFirstOrThrow();
    expect(Number(listRow.n)).toBe(7);

    const proteinItems = await db
      .selectFrom('food_items')
      .innerJoin('food_lists', 'food_lists.id', 'food_items.list_id')
      .where('food_lists.slug', '=', 'proteins')
      .select((eb) => eb.fn.countAll<string>().as('n'))
      .executeTakeFirstOrThrow();
    expect(Number(proteinItems.n)).toBeGreaterThanOrEqual(7);

    // The cleanse-vacation list is wired to the week-3 row.
    const vacation = await db
      .selectFrom('food_lists')
      .innerJoin('program_weeks', 'program_weeks.id', 'food_lists.week_id')
      .where('food_lists.slug', '=', 'cleanse-vacation')
      .select(['program_weeks.week_number'])
      .executeTakeFirstOrThrow();
    expect(vacation.week_number).toBe(3);
  });

  it('is idempotent: re-applying produces no row growth', async () => {
    const db = getTestDb();
    const bundle = await readSeedBundle('v1');
    await applySeedBundle(db, bundle);
    await applySeedBundle(db, bundle);

    const counts = async (table: 'program_weeks' | 'food_lists' | 'food_items'): Promise<number> => {
      const row = await db
        .selectFrom(table)
        .select((eb) => eb.fn.countAll<string>().as('n'))
        .executeTakeFirstOrThrow();
      return Number(row.n);
    };
    expect(await counts('program_weeks')).toBe(12);
    expect(await counts('food_lists')).toBe(7);
    // Items count is the sum of all `items` arrays in the seed; we just
    // verify it didn't double after a second apply.
    const after = await counts('food_items');
    await applySeedBundle(db, bundle);
    expect(await counts('food_items')).toBe(after);
  }, 15_000);

  it('updates content in place when JSON changes', async () => {
    const db = getTestDb();
    const bundle = await readSeedBundle('v1');
    await applySeedBundle(db, bundle);

    // Mutate one week and one list in-memory, re-apply, confirm the row
    // reflects the new content rather than a duplicate.
    const mutated = {
      ...bundle,
      weeks: bundle.weeks.map((w) =>
        w.weekNumber === 1
          ? { ...w, mission: { he: 'משימה חדשה', en: 'New mission' } }
          : w,
      ),
      lists: bundle.lists.map((l) =>
        l.slug === 'proteins'
          ? {
              ...l,
              items: [{ name: { he: 'ביצים בלבד', en: 'Eggs only' }, visualKey: 'eggs' as const }],
            }
          : l,
      ),
    };
    await applySeedBundle(db, mutated);

    const week1 = await db
      .selectFrom('program_weeks')
      .select(['mission_he', 'mission_en'])
      .where('week_number', '=', 1)
      .executeTakeFirstOrThrow();
    expect(week1.mission_en).toBe('New mission');

    const proteinsAfter = await db
      .selectFrom('food_items')
      .innerJoin('food_lists', 'food_lists.id', 'food_items.list_id')
      .where('food_lists.slug', '=', 'proteins')
      .select(['food_items.name_en'])
      .execute();
    expect(proteinsAfter.length).toBe(1);
    expect(proteinsAfter[0]?.name_en).toBe('Eggs only');
  }, 15_000);
});
